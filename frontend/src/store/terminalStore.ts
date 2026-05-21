import { create } from "zustand";

interface TerminalLine {
  type: "input" | "output" | "error" | "system";
  text: string;
  timestamp: number;
}

interface TerminalStore {
  lines: TerminalLine[];
  isRunning: boolean;
  addLine: (type: TerminalLine["type"], text: string) => void;
  clear: () => void;
  setRunning: (running: boolean) => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  lines: [
    { type: "system", text: "Welcome to CloudIDE Terminal", timestamp: Date.now() },
    { type: "output", text: "Type \x1b[1mhelp\x1b[0m for available commands.\n", timestamp: Date.now() },
  ],
  isRunning: false,
  addLine: (type, text) =>
    set((s) => ({ lines: [...s.lines, { type, text, timestamp: Date.now() }] })),
  clear: () =>
    set({ lines: [{ type: "system", text: "Terminal cleared.", timestamp: Date.now() }] }),
  setRunning: (running) => set({ isRunning: running }),
}));
