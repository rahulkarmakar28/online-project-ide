import { DEV_CMD_REWRITES } from "../utils/constant.js";

const rewriteCommand = (input) => {
    const trimmed = input.trim();
    for (const [pattern, replacement] of Object.entries(DEV_CMD_REWRITES)) {
        if (trimmed === pattern || trimmed.startsWith(pattern + " ")) {
            return replacement + trimmed.slice(pattern.length);
        }
    }
    return trimmed;
};

// ── Docker stream header stripper ─────────────────────────────────────────────
// Even with Tty:true, some Docker Engine versions prepend an 8-byte multiplexing
// header to EVERY chunk:
//   byte 0:    stream type  (0x00=stdin, 0x01=stdout, 0x02=stderr)
//   bytes 1-3: padding zeros
//   bytes 4-7: payload size (big-endian uint32)
//
// The leaked characters (z, 3, ), |, G, Y, W) are byte[7] — the LSB of the
// payload size. We detect and strip these headers before writing to xterm.
//
// Detection: valid if byte[0] is 0/1/2 AND bytes[1-3] are all 0x00.
// We process a buffer that may contain MULTIPLE frames in one chunk.
const demuxDockerStream = (chunk) => {
    // Fast path: if chunk doesn't look like a mux header, return as-is
    if (chunk.length < 8) return chunk;

    const b0 = chunk[0];
    // Check: stream type must be 0, 1, or 2 AND padding must be 0x00
    if ((b0 !== 0x00 && b0 !== 0x01 && b0 !== 0x02) ||
        chunk[1] !== 0 || chunk[2] !== 0 || chunk[3] !== 0) {
        return chunk; // not a mux header — raw TTY data, pass through
    }

    // It IS a mux header — extract all frames from this chunk
    const frames = [];
    let offset = 0;

    while (offset + 8 <= chunk.length) {
        const streamType  = chunk[offset];
        const isPadding   = chunk[offset+1] === 0 && chunk[offset+2] === 0 && chunk[offset+3] === 0;

        if ((streamType !== 0x00 && streamType !== 0x01 && streamType !== 0x02) || !isPadding) {
            // No longer a valid header — rest is raw data
            frames.push(chunk.slice(offset));
            break;
        }

        const payloadSize = chunk.readUInt32BE(offset + 4);
        const frameEnd    = offset + 8 + payloadSize;

        if (frameEnd > chunk.length) {
            // Partial frame — take what we have
            frames.push(chunk.slice(offset + 8));
            break;
        }

        if (payloadSize > 0) {
            frames.push(chunk.slice(offset + 8, frameEnd));
        }
        offset = frameEnd;
    }

    if (frames.length === 0) return chunk;
    if (frames.length === 1) return frames[0];
    return Buffer.concat(frames);
};

export const handleTerminalCreation = async (container, projectName, ws) => {
    const info = await container.inspect();
    if (!info.State.Running) { ws.close(); return; }

    const workingDir = `/workspace/${projectName}`;

    const exec = await container.exec({
        Cmd:          ["/bin/bash", "--rcfile", "/home/sandbox/.bashrc"],
        User:         "sandbox",
        WorkingDir:   workingDir,
        Env: [
            "HOME=/home/sandbox",
            `PWD=${workingDir}`,
            "TERM=xterm-256color",
            "COLORTERM=truecolor",
        ],
        AttachStdin:  true,
        AttachStdout: true,
        AttachStderr: true,
        Tty:          true,
    });

    exec.start({ hijack: true, stdin: true }, (err, stream) => {
        if (err) { console.error("[terminal] exec.start error:", err); ws.close(); return; }

        stream.on("data", (chunk) => {
            try {
                const payload = demuxDockerStream(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                if (payload && payload.length > 0) {
                    ws.send(payload, { binary: true });
                }
            } catch {}
        });

        stream.on("end",   () => console.log("[terminal] stream ended"));
        stream.on("error", (e) => console.error("[terminal] stream error:", e));

        ws.removeAllListeners("message");
        ws.removeAllListeners("close");

        let inputBuffer = "";

        ws.on("message", (chunk) => {
            if (stream.destroyed || stream.writableEnded) return;
            const raw  = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            const text = raw.toString("utf8");

            if (text.startsWith("{")) {
                try {
                    const msg = JSON.parse(text);
                    if (msg.type === "resize" && msg.cols && msg.rows) {
                        exec.resize({ w: msg.cols, h: msg.rows }).catch(() => {});
                    }
                    return;
                } catch {}
            }

            if (text === "\r") {
                const rewritten = rewriteCommand(inputBuffer);
                if (rewritten !== inputBuffer.trim()) {
                    stream.write("\x15");
                    stream.write(rewritten);
                }
                stream.write("\n");
                inputBuffer = "";
                return;
            }

            if (text === "\x7f") {
                inputBuffer = inputBuffer.slice(0, -1);
                stream.write(raw);
                return;
            }

            if (text.startsWith("\x1b") || (raw.length === 1 && raw[0] < 0x20)) {
                stream.write(raw);
                return;
            }

            inputBuffer += text;
            stream.write(raw);
        });

        ws.on("close", () => { stream.end(); });
    });
};

export async function waitForContainer(container, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const info = await container.inspect();
            if (info?.State?.Running)                            return true;
            if (["exited","dead"].includes(info?.State?.Status)) return false;
        } catch (e) { console.log("[terminal] inspect:", e.message); }
        await new Promise(r => setTimeout(r, 400));
    }
    return false;
}