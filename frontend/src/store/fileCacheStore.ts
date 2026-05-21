import { create } from "zustand";

interface FileCacheStore {
  fileCache: Record<string, string>;
  setFileContent: (path: string, value: string) => void;
}

export const useFileCacheStore = create<FileCacheStore>((set) => ({
  fileCache: {},
  setFileContent: (path, value) =>
    set((state) => ({ fileCache: { ...state.fileCache, [path]: value } })),
}));
