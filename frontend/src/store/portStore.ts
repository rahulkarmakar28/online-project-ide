import { create } from "zustand";

interface PortStore {
    port: number | null;
    setPort: (port: number | null) => void;
}

export const usePortStore = create<PortStore>((set) => ({
    port: null,
    setPort: (port) => set({ port }),
}));
