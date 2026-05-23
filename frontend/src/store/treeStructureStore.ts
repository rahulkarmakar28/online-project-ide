import { create } from "zustand";
import { getProjectTreeApi } from "../apis/projects";
import { sortTree, TreeNodeData } from "../utils/tree";

interface CreatingNode { parentPath: string; type: "file" | "folder"; }
interface RenamingNode { path: string; name: string; type: string; }

interface TreeStructureStore {
    projectId:        string | null;
    treeStructure:    TreeNodeData | null;
    creatingNode:     CreatingNode | null;
    renamingNode:     RenamingNode | null;
    setProjectId:     (id: string) => void;
    setTreeStructure: (tree: TreeNodeData) => void;
    refreshTree:      () => Promise<void>;
    startCreatingNode:(parentPath: string, type: "file" | "folder") => void;
    stopCreatingNode: () => void;
    startRenamingNode:(path: string, name: string, type: string) => void;
    stopRenamingNode: () => void;
    resetForProject:  (id: string) => void;
}

export const useTreeStructureStore = create<TreeStructureStore>((set, get) => ({
    projectId:     null,
    treeStructure: null,
    creatingNode:  null,
    renamingNode:  null,

    setProjectId: (id) => set({ projectId: id }),
    setTreeStructure: (tree) => set({ treeStructure: tree }),

    // Reset everything when switching projects so old tree never bleeds through
    resetForProject: (id) => set({
        projectId:     id,
        treeStructure: null,
        creatingNode:  null,
        renamingNode:  null,
    }),

    refreshTree: async () => {
        const { projectId } = get();
        if (!projectId) return;
        try {
            const data = await getProjectTreeApi(projectId);
            if (data?.tree) {
                const sorted      = sortTree(data.tree);
                const sandboxNode = sorted.children?.[0] ?? sorted;
                set({ treeStructure: sandboxNode });
            }
        } catch (err) {
            console.error("[tree] refresh failed", err);
        }
    },

    startCreatingNode: (parentPath, type) => set({ creatingNode: { parentPath, type } }),
    stopCreatingNode:  () => set({ creatingNode: null }),
    startRenamingNode: (path, name, type) => set({ renamingNode: { path, name, type } }),
    stopRenamingNode:  () => set({ renamingNode: null }),
}));