import fs from "fs/promises";
import path from "node:path";


const PROJECTS_DIR = path.resolve(
    process.env.PROJECTS_DIR || path.join(process.cwd(), "../projects")
);

console.log(`[editorHandler] PROJECTS_DIR = ${PROJECTS_DIR}`);

const unlockProject = async (projectId) => {
    const projectRoot = path.join(PROJECTS_DIR, projectId);
    try {
        const { execFile } = await import("node:child_process");
        const { promisify } = await import("node:util");
        const execAsync = promisify(execFile);
        await execAsync("chmod", ["-R", "777", projectRoot]);
    } catch(e) {
        console.log(e);
    }
};

export const handleEditorSocketEvents = (socket, editorNamespace, projectId) => {

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
            console.error("Error writing the file", error.message);
            editorNamespace.to(projectId).emit("ERROR", { data: "Error writing the file: " + error.message });
        }
    });

    socket.on("CreateFile", async ({ pathToFileOrFolder }) => {
        try {
            try { await fs.access(pathToFileOrFolder); return socket.emit("ERROR", { data: "File already exists" }); } catch {}
            await fs.mkdir(path.dirname(pathToFileOrFolder), { recursive: true });
            await fs.writeFile(pathToFileOrFolder, "");
            editorNamespace.to(projectId).emit("CreateFileSuccess", { path: pathToFileOrFolder });
            editorNamespace.to(projectId).emit("FileSystemChange", { event: "add", path: pathToFileOrFolder });
        } catch (error) {
            console.error("Error creating file", error.message);
            socket.emit("ERROR", { data: "Error creating file: " + error.message });
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
            console.error("Error Reading the file", error.message);
            socket.emit("ERROR", { data: error.message || "Error Reading the file" });
        }
    });

    socket.on("DeleteFile", async ({ pathToFileOrFolder }) => {
        try {
            await unlockProject(projectId);
            await fs.unlink(pathToFileOrFolder);
            editorNamespace.to(projectId).emit("DeleteFileSuccess", { data: "File Deleted Successfully" });
            editorNamespace.to(projectId).emit("FileSystemChange", { event: "unlink", path: pathToFileOrFolder });
        } catch (error) {
            console.error("Error Deleting the file", error.message);
            editorNamespace.to(projectId).emit("ERROR", { data: "Error Deleting the file: " + error.message });
        }
    });

    socket.on("CreateFolder", async ({ pathToFileOrFolder }) => {
        try {
            try { await fs.access(pathToFileOrFolder); return socket.emit("ERROR", { data: "Folder already exists" }); } catch {}
            await fs.mkdir(pathToFileOrFolder, { recursive: true });
            editorNamespace.to(projectId).emit("CreateFolderSuccess", { path: pathToFileOrFolder });
            editorNamespace.to(projectId).emit("FileSystemChange", { event: "addDir", path: pathToFileOrFolder });
        } catch (error) {
            console.error("Error creating folder", error.message);
            socket.emit("ERROR", { data: "Error creating folder: " + error.message });
        }
    });

    socket.on("DeleteFolder", async ({ pathToFileOrFolder }) => {
        try {
            await unlockProject(projectId);
            await fs.rm(pathToFileOrFolder, { recursive: true, force: true });
            editorNamespace.to(projectId).emit("DeleteFolderSuccess", { data: "Folder Deleted Successfully" });
            editorNamespace.to(projectId).emit("FileSystemChange", { event: "unlinkDir", path: pathToFileOrFolder });
        } catch (error) {
            console.error("Error Deleting the Folder", error.message);
            editorNamespace.to(projectId).emit("ERROR", { data: "Error Deleting the Folder: " + error.message });
        }
    });

    socket.on("Rename", async ({ oldPath, newPath }) => {
        try {
            try { await fs.access(newPath); return socket.emit("ERROR", { data: "File/Folder already exists" }); } catch {}
            await unlockProject(projectId);
            await fs.rename(oldPath, newPath);
            editorNamespace.to(projectId).emit("RenameSuccess", { oldPath, newPath });
            editorNamespace.to(projectId).emit("FileSystemChange", { event: "rename", path: newPath });
        } catch (error) {
            console.error("Rename error", error.message);
            editorNamespace.to(projectId).emit("ERROR", { data: "Rename failed: " + error.message });
        }
    });
};