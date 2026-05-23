import { create } from "zustand";

interface FileCacheStore {
    fileCache:      Record<string, string>;
    setFileContent: (path: string, value: string) => void;
    resetCache:     () => void;  // ← call when switching projects
}

export const useFileCacheStore = create<FileCacheStore>((set) => ({
    fileCache: {},
    setFileContent: (path, value) =>
        set((state) => ({ fileCache: { ...state.fileCache, [path]: value } })),
    resetCache: () => set({ fileCache: {} }),
}));