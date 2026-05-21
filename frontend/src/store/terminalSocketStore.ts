import { create } from "zustand";

interface TerminalSocketStore {
    terminalSocket: WebSocket | null;
    setTerminalSocket: (ws: WebSocket | null) => void;
    clearSocket: () => void;
}

export const useTerminalSocketStore = create<TerminalSocketStore>((set) => ({
    terminalSocket: null,
    setTerminalSocket: (ws) => set({ terminalSocket: ws }),
    clearSocket: () => set({ terminalSocket: null }),
}));
