import { DEV_CMD_REWRITES } from "../utils/constant.js";

// ── Rewrite dev-server commands to bind 0.0.0.0 ──────────────────────────────
const rewriteCommand = (input) => {
    const trimmed = input.trim();
    for (const [pattern, replacement] of Object.entries(DEV_CMD_REWRITES)) {
        if (trimmed === pattern || trimmed.startsWith(pattern + " ")) {
            const extra = trimmed.slice(pattern.length);
            return replacement + extra;
        }
    }
    return trimmed;
};

export const handleTerminalCreation = async (container, projectName, ws) => {
    const info = await container.inspect();
    if (!info.State.Running) {
        console.log("[terminal] Container not running");
        ws.close();
        return;
    }

    const workingDir = `/workspace/${projectName}`;

    // ── Create exec with Tty:true ─────────────────────────────────────────
    // Tty:true means Docker sends a plain byte stream (no multiplexing headers).
    // xterm's AttachAddon can consume this directly.
    const exec = await container.exec({
        Cmd:          ["/bin/bash"],
        User:         "sandbox",
        WorkingDir:   workingDir,
        Env: [
            `HOME=/home/sandbox`,
            `PWD=${workingDir}`,
            `TERM=xterm-256color`,
            `COLORTERM=truecolor`,
        ],
        AttachStdin:  true,
        AttachStdout: true,
        AttachStderr: true,
        Tty:          true,
    });

    exec.start({ hijack: true, stdin: true }, (err, stream) => {
        if (err) {
            console.error("[terminal] exec.start error:", err);
            ws.close();
            return;
        }

        // ── Forward container output → browser ────────────────────────────
        // With Tty:true the stream is a raw byte stream — no demux needed.
        // Send as binary so xterm receives it correctly.
        stream.on("data", (chunk) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(chunk, { binary: true });
            }
        });

        stream.on("end",   () => console.log("[terminal] stream ended"));
        stream.on("error", (e) => console.error("[terminal] stream error:", e));

        // ── Forward browser input → container ─────────────────────────────
        // Remove any previous listeners to avoid stacking on reconnect
        ws.removeAllListeners("message");

        let inputBuffer = "";

        ws.on("message", (chunk) => {
            if (stream.destroyed || stream.writableEnded) return;

            const raw  = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            const text = raw.toString("utf8");

            // Intercept JSON control messages from ProjectPlayground
            // (e.g. resize events) — don't forward to terminal
            if (text.startsWith("{") && text.includes('"type"')) {
                try {
                    const msg = JSON.parse(text);
                    if (msg.type === "resize" && msg.cols && msg.rows) {
                        exec.resize({ w: msg.cols, h: msg.rows }).catch(() => {});
                    }
                    return;
                } catch {
                    // not JSON, fall through
                }
            }

            // ENTER — rewrite command if needed, then send newline
            if (text === "\r") {
                const rewritten = rewriteCommand(inputBuffer);
                if (rewritten !== inputBuffer.trim()) {
                    stream.write("\x15");      // Ctrl+U clears current line
                    stream.write(rewritten);
                }
                stream.write("\n");
                inputBuffer = "";
                return;
            }

            // BACKSPACE
            if (text === "\x7f") {
                inputBuffer = inputBuffer.slice(0, -1);
                stream.write(raw);
                return;
            }

            // Control / escape sequences — pass through directly
            if (text.startsWith("\x1b") || (raw.length === 1 && raw[0] < 0x20)) {
                stream.write(raw);
                return;
            }

            // Normal printable chars
            inputBuffer += text;
            stream.write(raw);
        });

        ws.on("close", () => {
            stream.end();
            console.log("[terminal] ws closed, stream ended");
        });
    });
};

// ── Wait for container to reach Running state ─────────────────────────────────
export async function waitForContainer(container, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const info = await container.inspect();
            if (info?.State?.Running)                        return true;
            if (["exited","dead"].includes(info?.State?.Status)) return false;
        } catch (e) {
            console.log("[terminal] inspect error:", e.message);
        }
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log("[terminal] container timed out");
    return false;
}