import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import chokidar from "chokidar";
import path from "node:path";

import { EDITOR_PORT, PROJECTS_DIR } from "./config/serverConfig.js";
import { handleEditorSocketEvents } from "./socketHandlers/editorHandler.js";
import {
    getContainerPort,
    incrementWatcherRefs,
    decrementWatcherRefs,
    getWatcherRefs,
} from "./registry/containerRegistry.js";

const app    = express();
const server = createServer(app);
const io     = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Local watcher handles — process-local only, chokidar instances can't be stored in Redis.
// Redis tracks the ref count; the local Map tracks the actual watcher instance.
// If this worker restarts, it starts fresh — the next socket connection recreates the watcher.
const localWatchers = new Map(); // projectId → chokidar instance

const editorNamespace = io.of("/editor");

editorNamespace.on("connection", async (socket) => {
    const projectId = socket.handshake.query["projectId"];
    if (!projectId) { socket.disconnect(); return; }

    console.log(`[editor] connected  projectId=${projectId}  socket=${socket.id}`);
    socket.join(projectId);

    // ── Chokidar watcher (ref-counted via Redis) ──────────────────────────
    const refs = await incrementWatcherRefs(projectId);

    if (!localWatchers.has(projectId)) {
        const watchPath = path.resolve(PROJECTS_DIR, projectId);
        const watcher   = chokidar.watch(watchPath, {
            ignored: (p) =>
                p.includes("node_modules") ||
                p.includes(".git")         ||
                p.includes("__pycache__")  ||
                p.includes("target/debug"),
            persistent:       true,
            ignoreInitial:    true,
            awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
        });
        watcher.on("all", (event, filePath) => {
            editorNamespace.to(projectId).emit("FileSystemChange", { event, path: filePath });
        });
        localWatchers.set(projectId, watcher);
        console.log(`[watcher] started for ${projectId} (refs=${refs})`);
    } else {
        console.log(`[watcher] reused for ${projectId} (refs=${refs})`);
    }

    // ── Port events ───────────────────────────────────────────────────────
    const sendPort = async (eventName) => {
        const port = await getContainerPort(projectId);
        console.log(`[port] ${eventName} for ${projectId} → ${port}`);
        if (port) socket.emit("GET_PORT_SUCCESS", { port });
    };

    socket.on("GET_PORT",     () => sendPort("GET_PORT"));
    socket.on("preview-port", () => sendPort("preview-port"));

    handleEditorSocketEvents(socket, editorNamespace, projectId);

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
        console.log(`[editor] disconnected  socket=${socket.id}  projectId=${projectId}`);

        const remaining = await decrementWatcherRefs(projectId);

        if (remaining <= 0 && localWatchers.has(projectId)) {
            const watcher = localWatchers.get(projectId);
            await watcher.close();
            localWatchers.delete(projectId);
            console.log(`[watcher] stopped for ${projectId}`);
        } else {
            console.log(`[watcher] kept alive for ${projectId} (refs=${remaining})`);
        }
    });
});

server.listen(EDITOR_PORT, () =>
    console.log(`[editor] Server running on port: ${EDITOR_PORT}`),
);