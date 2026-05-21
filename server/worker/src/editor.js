import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { Server } from "socket.io";
import chokidar from "chokidar";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EDITOR_PORT } from "./config/serverConfig.js";
import { handleEditorSocketEvents } from "./socketHandlers/editorHandler.js";
import { getContainerPort, PROJECTS_DIR } from "./containers/handleContainerCreate.js";

const app    = express();
const server = createServer(app);
const io     = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const watchers = new Map();
const editorNamespace = io.of("/editor");

editorNamespace.on("connection", (socket) => {
    const projectId = socket.handshake.query["projectId"];
    if (!projectId) { socket.disconnect(); return; }

    console.log(`[editor] connected  projectId=${projectId}  socket=${socket.id}`);
    socket.join(projectId);

    // ── Chokidar file watcher — one per project ───────────────────────────
    if (!watchers.has(projectId)) {
        const watchPath = path.resolve(PROJECTS_DIR, projectId);
        const watcher = chokidar.watch(watchPath, {
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

        watchers.set(projectId, { watcher, refCount: 1 });
        console.log(`[watcher] started for ${projectId}`);
    } else {
        watchers.get(projectId).refCount++;
    }

    // ── GET_PORT — frontend sends this event name, we respond with the same ─
    // Also handle the old "preview-port" name for backward compat
    const sendPort = (name) => {
        const port = getContainerPort(projectId);
        console.log(`[port] ${name} requested for ${projectId} → ${port}`);
        socket.emit("GET_PORT_SUCCESS", { port });
    };

    socket.on("GET_PORT",     () => sendPort("GET_PORT"));
    socket.on("preview-port", () => sendPort("preview-port"));

    // ── File / folder CRUD ────────────────────────────────────────────────
    handleEditorSocketEvents(socket, editorNamespace, projectId);

    // ── Cleanup ───────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
        console.log(`[editor] disconnected  socket=${socket.id}`);
        const entry = watchers.get(projectId);
        if (entry) {
            entry.refCount--;
            if (entry.refCount <= 0) {
                await entry.watcher.close();
                watchers.delete(projectId);
                console.log(`[watcher] stopped for ${projectId}`);
            }
        }
    });
});

server.listen(EDITOR_PORT, () =>
    console.log(`Editor Server running on port: ${EDITOR_PORT}`),
);
