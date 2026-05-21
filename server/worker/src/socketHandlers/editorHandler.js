import fs from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROJECTS_DIR = path.resolve(__dirname, "../../..", "projects");


const unlockProject = async (projectId) => {
    const projectRoot = path.join(PROJECTS_DIR, projectId);
    try {
        await execFileAsync("chmod", ["-R", "777", projectRoot]);
    } catch {
        // best-effort — real error will surface from the fs operation below
    }
};

export const handleEditorSocketEvents = (socket, editorNamespace, projectId) => {

    // ── File operations ───────────────────────────────────────────────────────

    socket.on("WriteFile", async ({ data, pathToFileOrFolder }) => {
        try {
            await unlockProject(projectId);
            await fs.writeFile(pathToFileOrFolder, data);
            editorNamespace.to(projectId).emit("WriteFileSuccess", {
                data:  "File Written Successfully",
                path:  pathToFileOrFolder,
                value: data,
            });
        } catch (error) {
            console.log("Error writing the file", error);
            editorNamespace.to(projectId).emit("ERROR", { data: "Error writing the file" });
        }
    });

    socket.on("CreateFile", async ({ pathToFileOrFolder }) => {
        try {
            try {
                await fs.access(pathToFileOrFolder);
                return socket.emit("ERROR", { data: "File already exists" });
            } catch {}
            await fs.writeFile(pathToFileOrFolder, "");
            editorNamespace.to(projectId).emit("CreateFileSuccess", { path: pathToFileOrFolder });
        } catch (error) {
            console.log("Error creating file", error);
            socket.emit("ERROR", { data: "Error creating file" });
        }
    });

    socket.on("ReadFile", async ({ pathToFileOrFolder }) => {
        try {
            if (!pathToFileOrFolder) throw new Error("Invalid path received");
            const response = await fs.readFile(pathToFileOrFolder);
            editorNamespace.to(projectId).emit("ReadFileSuccess", {
                value: response.toString(),
                path:  pathToFileOrFolder,
            });
        } catch (error) {
            console.log("Error Reading the file", error);
            socket.emit("ERROR", { data: error.message || "Error Reading the file" });
        }
    });

    socket.on("DeleteFile", async ({ pathToFileOrFolder }) => {
        try {
            await unlockProject(projectId);
            await fs.unlink(pathToFileOrFolder);
            editorNamespace.to(projectId).emit("DeleteFileSuccess", { data: "File Deleted Successfully" });
        } catch (error) {
            console.log("Error Deleting the file", error);
            editorNamespace.to(projectId).emit("ERROR", { data: "Error Deleting the file" });
        }
    });

    // ── Folder operations ─────────────────────────────────────────────────────

    socket.on("CreateFolder", async ({ pathToFileOrFolder }) => {
        try {
            try {
                await fs.access(pathToFileOrFolder);
                return socket.emit("ERROR", { data: "Folder already exists" });
            } catch {}
            await fs.mkdir(pathToFileOrFolder, { recursive: true });
            editorNamespace.to(projectId).emit("CreateFolderSuccess", { path: pathToFileOrFolder });
        } catch (error) {
            console.log("Error creating folder", error);
            socket.emit("ERROR", { data: "Error creating folder" });
        }
    });

    socket.on("DeleteFolder", async ({ pathToFileOrFolder }) => {
        try {
            await unlockProject(projectId);
            await fs.rm(pathToFileOrFolder, { recursive: true, force: true });
            editorNamespace.to(projectId).emit("DeleteFolderSuccess", { data: "Folder Deleted Successfully" });
        } catch (error) {
            console.log("Error Deleting the Folder", error);
            editorNamespace.to(projectId).emit("ERROR", { data: "Error Deleting the Folder" });
        }
    });

    socket.on("Rename", async ({ oldPath, newPath }) => {
        try {
            try {
                await fs.access(newPath);
                return socket.emit("ERROR", { data: "File/Folder already exists" });
            } catch {}
            await unlockProject(projectId);
            await fs.rename(oldPath, newPath);
            editorNamespace.to(projectId).emit("RenameSuccess", { oldPath, newPath });
        } catch (error) {
            console.log("Rename error", error);
            editorNamespace.to(projectId).emit("ERROR", { data: "Rename failed" });
        }
    });
};