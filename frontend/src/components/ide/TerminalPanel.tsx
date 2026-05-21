import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useTerminalSocketStore } from "@/store/terminalSocketStore";
import { usePortStore } from "@/store/portStore";
import {
    VscTerminal, VscTrash, VscChevronUp, VscChevronDown,
    VscAdd, VscClose, VscSplitHorizontal,
} from "react-icons/vsc";
import { useState } from "react";

export const TerminalPanel = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef      = useRef<Terminal | null>(null);
    const fitRef       = useRef<FitAddon | null>(null);
    const { terminalSocket } = useTerminalSocketStore();
    const { setPort } = usePortStore();
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (!terminalSocket || !containerRef.current) return;

        termRef.current?.dispose();

        const term = new Terminal({
            cursorBlink:  true,
            fontSize:     13,
            fontFamily:   "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
            theme: {
                background:  "#1e1e1e",
                foreground:  "#d4d4d4",
                cursor:      "#ffffff",
                black:       "#000000",
                red:         "#cd3131",
                green:       "#0dbc79",
                yellow:      "#e5e510",
                blue:        "#2472c8",
                magenta:     "#bc3fbc",
                cyan:        "#11a8cd",
                white:       "#e5e5e5",
                brightBlack: "#666666",
                brightWhite: "#ffffff",
            },
            scrollback: 5000,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(containerRef.current);
        setTimeout(() => fitAddon.fit(), 100);

        termRef.current = term;
        fitRef.current  = fitAddon;

        // ── Wire WebSocket manually instead of using AttachAddon ─────────
        // AttachAddon passes ALL messages (including our JSON control frames)
        // directly to xterm, corrupting display.
        // We filter here before writing to terminal.
        const onMessage = (event: MessageEvent) => {
            let data = event.data;

            // Try to detect JSON control messages
            if (typeof data === "string") {
                try {
                    const msg = JSON.parse(data);
                    // Handle preview-port update
                    if (msg.type === "preview-port" && msg.port) {
                        setPort(Number(msg.port));
                        return; // don't write to terminal
                    }
                } catch {
                    // Not JSON — write as-is
                }
                term.write(data);
                return;
            }

            // Binary data — always terminal output
            if (data instanceof Blob) {
                data.arrayBuffer().then((buf) => {
                    term.write(new Uint8Array(buf));
                });
                return;
            }

            if (data instanceof ArrayBuffer) {
                term.write(new Uint8Array(data));
                return;
            }

            term.write(data);
        };

        // ── Forward xterm keystrokes → WebSocket ──────────────────────────
        const onData = term.onData((data) => {
            if (terminalSocket.readyState === WebSocket.OPEN) {
                terminalSocket.send(data);
            }
        });

        // ── Forward resize events ─────────────────────────────────────────
        const onResize = term.onResize(({ cols, rows }) => {
            if (terminalSocket.readyState === WebSocket.OPEN) {
                try {
                    terminalSocket.send(JSON.stringify({ type: "resize", cols, rows }));
                } catch {}
            }
        });

        terminalSocket.addEventListener("message", onMessage);

        const handleResize = () => fitAddon.fit();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            terminalSocket.removeEventListener("message", onMessage);
            onData.dispose();
            onResize.dispose();
            term.dispose();
        };
    }, [terminalSocket]);

    useEffect(() => {
        if (!isMinimized) setTimeout(() => fitRef.current?.fit(), 50);
    }, [isMinimized]);

    return (
        <div
            className={`flex flex-col h-full transition-all duration-200 ${isMinimized ? "!h-[35px]" : ""}`}
            style={{ background: "#1e1e1e" }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between h-[35px] min-h-[35px] select-none"
                style={{ background: "#252526", borderBottom: "1px solid #1e1e1e" }}
            >
                <div className="flex items-center h-full">
                    {["PROBLEMS", "OUTPUT", "DEBUG CONSOLE", "TERMINAL"].map((tab) => (
                        <button
                            key={tab}
                            className={`px-3 h-full text-[11px] uppercase tracking-wide font-medium transition-colors
                                ${tab === "TERMINAL"
                                    ? "text-[#e0e0e0] border-b border-b-[#e0e0e0]"
                                    : "text-[#858585] hover:text-[#b0b0b0]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-0.5 px-2">
                    {terminalSocket ? (
                        <span className="flex items-center gap-1 text-[10px] text-[#4ec9b0] mr-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0] animate-pulse" />
                            connected
                        </span>
                    ) : (
                        <span className="text-[10px] text-[#858585] mr-2">Not connected</span>
                    )}
                    <button className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585]" title="New Terminal">
                        <VscAdd className="text-sm" />
                    </button>
                    <button className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585]" title="Split Terminal">
                        <VscSplitHorizontal className="text-sm" />
                    </button>
                    <button
                        onClick={() => termRef.current?.clear()}
                        className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585]"
                        title="Clear"
                    >
                        <VscTrash className="text-sm" />
                    </button>
                    <button
                        onClick={() => setIsMinimized((m) => !m)}
                        className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585]"
                    >
                        {isMinimized ? <VscChevronUp className="text-sm" /> : <VscChevronDown className="text-sm" />}
                    </button>
                    <button className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585]">
                        <VscClose className="text-sm" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="flex flex-1 overflow-hidden">
                    <div
                        className="w-[120px] min-w-[120px] flex flex-col py-1"
                        style={{ background: "#252526", borderRight: "1px solid #1e1e1e" }}
                    >
                        <button className="flex items-center gap-1.5 px-2 py-1 text-[11px] bg-[#37373d] text-[#cccccc]">
                            <VscTerminal className="text-xs" />
                            <span className="truncate">bash</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {terminalSocket ? (
                            <div ref={containerRef} className="w-full h-full p-1" />
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center h-full gap-2"
                                style={{ color: "#858585" }}
                            >
                                <VscTerminal className="text-2xl" />
                                <p className="text-[12px]">Terminal connects when project loads</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};