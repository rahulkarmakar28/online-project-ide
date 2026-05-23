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

        // Send as binary — Tty:true means raw stream, no multiplexing headers
        stream.on("data",  chunk => { try { ws.send(chunk, { binary: true }); } catch {} });
        stream.on("end",   ()    => console.log("[terminal] stream ended"));
        stream.on("error", e    => console.error("[terminal] stream error:", e));

        ws.removeAllListeners("message");
        ws.removeAllListeners("close");

        let inputBuffer = "";

        ws.on("message", chunk => {
            if (stream.destroyed || stream.writableEnded) return;
            const raw  = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            const text = raw.toString("utf8");

            // JSON control messages (resize) — don't forward to terminal
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