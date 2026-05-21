import { create } from "zustand";
import { useActiveFileTabStore } from "./activeFileTabStore";
import { useTreeStructureStore }  from "./treeStructureStore";
import { useFileCacheStore }      from "./fileCacheStore";
import { usePortStore }           from "./portStore";

interface EditorSocketStore {
    editorSocket: any | null;
    setEditorSocket: (socket: any) => void;
    clearSocket:     () => void;
}

export const useEditorSocketStore = create<EditorSocketStore>((set) => ({
    editorSocket: null,

    setEditorSocket: (socket) => {
        const refreshTree    = useTreeStructureStore.getState().refreshTree;
        const setFileContent = useFileCacheStore.getState().setFileContent;
        const setPort        = usePortStore.getState().setPort;

        // ── ReadFile: server sends file content back ───────────────────────
        // FIX: Always call setActiveFileTab so the tab gets real content
        // regardless of what was open before (first click was setting a placeholder).
        socket?.on("ReadFileSuccess", (data: { path: string; value: string }) => {
            const { setActiveFileTab } = useActiveFileTabStore.getState();
            const fileName = data.path.split(/[/\\]/).pop() ?? "";
            setFileContent(data.path, data.value);
            // Always open this file — it was explicitly requested by the user clicking it
            setActiveFileTab(data.path, data.value, fileName);
        });

        // ── WriteFile: update cache with server-confirmed content ─────────
        socket?.on("WriteFileSuccess", (data: { path: string; value: string }) => {
            const { activeFileTab, setActiveFileTab } = useActiveFileTabStore.getState();
            setFileContent(data.path, data.value);
            if (activeFileTab?.path === data.path) {
                setActiveFileTab(data.path, data.value, activeFileTab.name);
            }
        });

        // ── Tree refresh on CRUD ──────────────────────────────────────────
        socket?.on("CreateFileSuccess",   () => refreshTree());
        socket?.on("DeleteFileSuccess",   () => refreshTree());
        socket?.on("CreateFolderSuccess", () => refreshTree());
        socket?.on("DeleteFolderSuccess", () => refreshTree());
        socket?.on("RenameSuccess",       () => refreshTree());

        // ── Tree refresh on fs changes from terminal ──────────────────────
        socket?.on("FileSystemChange", () => refreshTree());

        // ── Port from container ───────────────────────────────────────────
        socket?.on("GET_PORT_SUCCESS", ({ port }: { port: number }) => {
            if (port) setPort(port);
        });

        set({ editorSocket: socket });
    },

    clearSocket: () => set({ editorSocket: null }),
}));
