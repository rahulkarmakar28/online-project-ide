import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import { WebSocketServer } from "ws";

import { TERMINAL_PORT } from "./config/serverConfig.js";
import { handleContainerCreate, getContainerPort } from "./containers/handleContainerCreate.js";
import { handleTerminalCreation, waitForContainer } from "./containers/handleTerminalCreation.js";

const app    = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

    console.log(`[SERVER] Terminal connected — projectId: ${projectId}, template: ${template}`);

    const container = await handleContainerCreate(projectId, template, projectName);
    if (!container) {
        ws.send(Buffer.from("Error: failed to start container\r\n"));
        ws.close();
        return;
    }

    const isReady = await waitForContainer(container);
    if (!isReady) {
        ws.send(Buffer.from("Error: container failed to start\r\n"));
        ws.close();
        return;
    }

    // Send port as binary-safe marker BEFORE AttachAddon takes over.
    // ProjectPlayground listens for this in ws.addEventListener("message").
    // We prefix with a null byte so xterm ignores it if it leaks through.
    const port = getContainerPort(projectId);
    if (port) {
        // Send as a special JSON frame — ProjectPlayground filters this out
        // before passing data to xterm by checking ws messages in its own listener.
        try {
            ws.send(JSON.stringify({ type: "preview-port", port }));
        } catch {}
    }

    await handleTerminalCreation(container, projectName, ws);

    ws.on("close", () => console.log(`[SERVER] WS closed: ${projectId}`));
});

server.listen(TERMINAL_PORT, () =>
    console.log(`Terminal Server running on port: ${TERMINAL_PORT}`),
);