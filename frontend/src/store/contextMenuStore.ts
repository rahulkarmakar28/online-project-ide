import { create } from "zustand";

interface ContextMenuState {
  x: number;
  y: number;
  isOpen: boolean;
  path: string | null;
  type: "file" | "folder" | null;
  targetName: string | null;
  openMenu: (opts: { x: number; y: number; path: string; type: "file" | "folder"; targetName: string }) => void;
  closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  x: 0, y: 0, isOpen: false, path: null, type: null, targetName: null,
  openMenu: ({ x, y, path, type, targetName }) =>
    set({ x, y, path, type, targetName, isOpen: true }),
  closeMenu: () =>
    set({ isOpen: false, path: null, type: null, targetName: null }),
}));
