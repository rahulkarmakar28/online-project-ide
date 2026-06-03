import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { WebSocketServer } from "ws";
import Docker from "dockerode";
import fs from "node:fs";
import os from "node:os";

import { TERMINAL_PORT } from "./config/serverConfig.js";
import { handleContainerCreate, getContainerPort, PROJECTS_DIR } from "./containers/handleContainerCreate.js";
import { handleTerminalCreation, waitForContainer } from "./containers/handleTerminalCreation.js";

const app    = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const wss = new WebSocketServer({ noServer: true });

// ── Docker client (for container cleanup) ─────────────────────────────────────
const getDocker = () => {
    const host = (process.env.DOCKER_HOST || "").trim();
    if (host) return new Docker({ socketPath: host.replace("unix://","").replace("npipe://","") });
    if (os.platform() === "win32") return new Docker({ socketPath: "//./pipe/docker_engine" });
    const uid = process.getuid?.() ?? 0;
    const xdg = process.env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
    const candidates = ["/var/run/docker.sock", `${xdg}/docker.sock`, `${xdg}/podman/podman.sock`];
    for (const s of candidates) { if (fs.existsSync(s)) return new Docker({ socketPath: s }); }
    return new Docker({ socketPath: "/var/run/docker.sock" });
};

const docker = getDocker();

// ── Container cleanup tracker ─────────────────────────────────────────────────
// projectId → { timer, connections }
// - When WS closes: if connections drops to 0, start a 2-min timer
// - If user reopens within 2 min: cancel the timer
// - On browser hard-close (unload): remove immediately via a special message
const cleanupTimers  = new Map(); // projectId → setTimeout handle
const connectionCount = new Map(); // projectId → number of active WS connections

const stopContainer = async (projectId) => {
    try {
        const containers = await docker.listContainers({ all: false });
        const found = containers.find((c) =>
            c.Names.some((n) => n === `/project-${projectId}`),
        );
        if (!found) return;
        const container = docker.getContainer(found.Id);
        await container.stop({ t: 5 });
        await container.remove({ force: true });
        console.log(`[cleanup] Container removed for ${projectId}`);
    } catch (err) {
        if (!err.message?.includes("no such container") &&
            !err.message?.includes("404")) {
            console.error(`[cleanup] Error removing ${projectId}:`, err.message);
        }
    }
};

const scheduleCleanup = (projectId, delayMs) => {
    // Cancel any existing timer
    if (cleanupTimers.has(projectId)) {
        clearTimeout(cleanupTimers.get(projectId));
    }
    const timer = setTimeout(async () => {
        cleanupTimers.delete(projectId);
        // Double-check no one reconnected
        if ((connectionCount.get(projectId) ?? 0) <= 0) {
            console.log(`[cleanup] Stopping container for ${projectId} after inactivity`);
            await stopContainer(projectId);
        }
    }, delayMs);
    cleanupTimers.set(projectId, timer);
};

const cancelCleanup = (projectId) => {
    if (cleanupTimers.has(projectId)) {
        clearTimeout(cleanupTimers.get(projectId));
        cleanupTimers.delete(projectId);
        console.log(`[cleanup] Cancelled cleanup timer for ${projectId}`);
    }
};

// ─────────────────────────────────────────────────────────────────────────────

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

    console.log(`[SERVER] Terminal connected — projectId: ${projectId}, template: ${template}`);

    // Track connection count and cancel any pending cleanup
    connectionCount.set(projectId, (connectionCount.get(projectId) ?? 0) + 1);
    cancelCleanup(projectId);

    const container = await handleContainerCreate(projectId, template, projectName);

    if (!container) {
        connectionCount.set(projectId, (connectionCount.get(projectId) ?? 1) - 1);
        try { ws.send(Buffer.from("\r\n\x1b[31mError: failed to start container.\x1b[0m\r\n")); } catch {}
        ws.close();
        return;
    }

    const isReady = await waitForContainer(container);

    if (!isReady) {
        connectionCount.set(projectId, (connectionCount.get(projectId) ?? 1) - 1);
        try { ws.send(Buffer.from("\r\n\x1b[31mError: container timed out.\x1b[0m\r\n")); } catch {}
        ws.close();
        return;
    }

    const port = getContainerPort(projectId);
    try { ws.send(JSON.stringify({ type: "preview-port", port })); } catch {}

    await handleTerminalCreation(container, projectName, ws);

    ws.on("message", (data) => {
        // Listen for the special "close-now" message sent when the user
        // navigates away (window beforeunload) — remove container immediately
        try {
            const msg = JSON.parse(
                Buffer.isBuffer(data) ? data.toString() : data
            );
            if (msg?.type === "close-now" && msg.projectId === projectId) {
                console.log(`[cleanup] Immediate cleanup requested for ${projectId}`);
                connectionCount.set(projectId, 0);
                stopContainer(projectId);
            }
        } catch {}
    });

    ws.on("close", () => {
        console.log(`[SERVER] WS closed: ${projectId}`);
        const count = Math.max(0, (connectionCount.get(projectId) ?? 1) - 1);
        connectionCount.set(projectId, count);

        if (count <= 0) {
            // Schedule container removal after 1 minutes
            // This gives the user time to navigate back without losing their container
            console.log(`[cleanup] Scheduling cleanup for ${projectId} in 2 minutes`);
            scheduleCleanup(projectId, 1 * 60 * 1000);
        }
    });
});

server.listen(TERMINAL_PORT, () => {
    console.log(`[SERVER] Terminal server running on port: ${TERMINAL_PORT}`);
});