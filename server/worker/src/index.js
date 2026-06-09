import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { WebSocketServer } from "ws";

import { TERMINAL_PORT } from "./config/serverConfig.js";
import { handleContainerCreate } from "./containers/handleContainerCreate.js";
import { handleTerminalCreation, waitForContainer } from "./containers/handleTerminalCreation.js";
import {
    getContainerPort,
    incrementConnections,
    decrementConnections,
    scheduleCleanup,
    cancelCleanup,
    stopContainer,
    startCleanupPoller,
} from "./registry/containerRegistry.js";

const app    = express();
const server = createServer(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Start poller AFTER server is defined — errors here shouldn't crash the process
try {
    startCleanupPoller();
} catch (err) {
    console.error("[startup] startCleanupPoller failed:", err.message);
}

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
    if (!req.url.startsWith("/terminal")) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", async (ws, req) => {
    const url         = new URL(req.url, "http://localhost");
    const projectId   = url.searchParams.get("projectId");
    const template    = url.searchParams.get("template") || "react-js";
    const projectName = url.searchParams.get("name")     || "sandbox";

    if (!projectId) { ws.close(); return; }

    console.log(`[SERVER] Terminal connected — projectId: ${projectId}`);

    await incrementConnections(projectId);
    await cancelCleanup(projectId);

    // ── close-now handler ────────────────────────────────────────────────────
    // Kept as a named function so it can be removed precisely after use,
    // without touching the terminal input listener added by handleTerminalCreation.
    let closeNowReceived = false;

    const handleCloseNow = async (data) => {
        try {
            const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);
            if (!text.startsWith("{")) return;
            const msg = JSON.parse(text);
            if (msg?.type === "close-now" && msg.projectId === projectId) {
                console.log(`[cleanup] close-now — removing immediately: ${projectId}`);
                closeNowReceived = true;
                // Remove this listener immediately so it doesn't fire again
                ws.off("message", handleCloseNow);
                await decrementConnections(projectId);
                await cancelCleanup(projectId);
                await stopContainer(projectId);
            }
        } catch {}
    };

    // Attach BEFORE handleTerminalCreation so it's in place from the start.
    // handleTerminalCreation uses ws.on("message", ...) for terminal input —
    // multiple "message" listeners are fine; Node EventEmitter fans them all out.
    // Do NOT call removeAllListeners — that would kill the terminal input handler.
    ws.on("message", handleCloseNow);

    // ── container setup ──────────────────────────────────────────────────────
    const container = await handleContainerCreate(projectId, template, projectName);

    if (!container) {
        ws.off("message", handleCloseNow);
        await decrementConnections(projectId);
        try { ws.send(Buffer.from("\r\n\x1b[31mError: failed to start container.\x1b[0m\r\n")); } catch {}
        ws.close();
        return;
    }

    const isReady = await waitForContainer(container);
    if (!isReady) {
        ws.off("message", handleCloseNow);
        await decrementConnections(projectId);
        try { ws.send(Buffer.from("\r\n\x1b[31mError: container timed out.\x1b[0m\r\n")); } catch {}
        ws.close();
        return;
    }

    // Send preview port (guard against null/undefined from Redis miss)
    const port = await getContainerPort(projectId);
    if (port) {
        try { ws.send(JSON.stringify({ type: "preview-port", port })); } catch {}
    }

    await handleTerminalCreation(container, projectName, ws);

    // ── cleanup on disconnect ────────────────────────────────────────────────
    ws.on("close", async () => {
        ws.off("message", handleCloseNow);
        console.log(`[SERVER] WS closed: ${projectId}`);

        if (closeNowReceived) return; // already handled above

        const count = await decrementConnections(projectId);
        if (count <= 0) {
            console.log(`[cleanup] Scheduling cleanup for ${projectId} in 2 minutes`);
            await scheduleCleanup(projectId, 120);
        }
    });
});

server.listen(TERMINAL_PORT, () => {
    console.log(`[SERVER] Terminal server running on port: ${TERMINAL_PORT}`);
});