import { useState, useCallback, useEffect } from "react";
import {
    VscPlay, VscSettingsGear, VscSearch,
    VscMenu, VscBrowser, VscColorMode, VscAccount,
} from "react-icons/vsc";
import { useNavigate } from "react-router-dom";
import { useThemeStore, themes } from "@/store/themeStore";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { useEditorSocketStore } from "@/store/editorSocketStore";
import { useTerminalSocketStore } from "@/store/terminalSocketStore";
import { SettingsDialog } from "./SettingsDialog";
import { CommandPalette } from "./CommandPalette";
import { MenuDropdown } from "./MenuDropdown";
import { toast } from "sonner";

interface IDEHeaderProps {
    projectName?: string;
    template?: string;
    onToggleSidebar?: () => void;
    onToggleBrowser?: () => void;
    onToggleTerminal?: () => void;
    showBrowser?: boolean;
}

export const IDEHeader = ({
    projectName = "project",
    template = "react-js",
    onToggleSidebar,
    onToggleBrowser,
    onToggleTerminal,
    showBrowser,
}: IDEHeaderProps) => {
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [paletteOpen, setPaletteOpen]   = useState(false);
    const [openMenu, setOpenMenu]         = useState<string | null>(null);
    const { currentTheme, setTheme } = useThemeStore();
    const { activeFileTab, closeTab, openTabs } = useActiveFileTabStore();
    const { editorSocket } = useEditorSocketStore();
    const { terminalSocket } = useTerminalSocketStore();

    // These must match exactly what the terminal rewrite layer or package.json scripts expect.
    // For templates where scaffold patches package.json, just send "npm run dev".
    const DEV_COMMANDS: Record<string, string> = {
        "react-js":    "npm run dev",
        "react-ts":    "npm run dev",
        "vue":         "npm run dev",
        "nextjs":      "npm run dev",
        "angular":     "npm run dev",
        "html-css-js": "npm run dev",
        "nodejs":      "npm run dev",
        "hono":        "npm run dev",
        "python":      "python3 main.py",
        "fastapi":     "uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
        "flask":       "flask run --host=0.0.0.0",
        "django":      "python3 manage.py runserver 0.0.0.0:8000",
        "spring-boot": "./mvnw spring-boot:run",
        "go":          "go run main.go",
        "rust":        "cargo run",
        "java":        "javac Main.java && java Main",
    };

    const handleRun = useCallback(() => {
        const cmd = DEV_COMMANDS[template] ?? "npm run dev";
        if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
            // Send command directly to the terminal WebSocket
            terminalSocket.send(cmd + "\r");
            toast.success("Command sent to terminal", { description: cmd });
        } else {
            toast.info("Terminal not connected yet", { description: cmd });
        }
    }, [template, terminalSocket]);

    const handleSave = useCallback(() => {
        if (activeFileTab && editorSocket) {
            editorSocket.emit("WriteFile", {
                data: activeFileTab.value ?? "",
                pathToFileOrFolder: activeFileTab.path,
            });
            toast.success("File saved", { description: activeFileTab.name });
        }
    }, [activeFileTab, editorSocket]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); setPaletteOpen((p) => !p); }
            if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
            if ((e.ctrlKey || e.metaKey) && e.key === "`") { e.preventDefault(); onToggleTerminal?.(); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleSave, onToggleTerminal]);

    const cycleTheme = () => {
        const idx  = themes.findIndex((t) => t.name === currentTheme);
        const next = themes[(idx + 1) % themes.length];
        setTheme(next.name);
        toast.info(`Theme: ${next.label}`);
    };

    const fileMenuItems = [
        { label: "Save",       shortcut: "Ctrl+S", action: handleSave },
        { label: "Save All",   shortcut: "Ctrl+Shift+S", action: () => toast.success("All files saved") },
        { divider: true, label: "" },
        { label: "Close Editor", shortcut: "Ctrl+W", action: () => activeFileTab && closeTab(activeFileTab.path) },
        { label: "Close All",    action: () => openTabs.forEach((t) => closeTab(t.path)) },
    ];

    const viewMenuItems = [
        { label: "Command Palette…", shortcut: "Ctrl+P", action: () => setPaletteOpen(true) },
        { divider: true, label: "" },
        { label: "Explorer",  shortcut: "Ctrl+B", action: onToggleSidebar },
        { label: "Terminal",  shortcut: "Ctrl+`", action: onToggleTerminal },
        { divider: true, label: "" },
        { label: "Settings",  shortcut: "Ctrl+,", action: () => setSettingsOpen(true) },
    ];

    const runMenuItems = [
        { label: "Run Project", shortcut: "F5", action: handleRun },
    ];

    const menus: Record<string, any[]> = {
        File: fileMenuItems,
        View: viewMenuItems,
        Run: runMenuItems,
        Help: [{ label: "About CloudIDE", action: () => toast.info("CloudIDE v1.0.0") }],
    };

    return (
        <>
            <header
                className="flex items-center justify-between h-[30px] min-h-[30px] select-none relative"
                style={{ background: "#3c3c3c", borderBottom: "1px solid #252526" }}
            >
                {/* Left */}
                <div className="flex items-center h-full">
                    <button onClick={onToggleSidebar} className="px-2 h-full hover:bg-[#505050] text-[#cccccc] transition-colors">
                        <VscMenu className="text-sm" />
                    </button>
                    {Object.keys(menus).map((key) => (
                        <MenuDropdown
                            key={key}
                            label={key}
                            items={menus[key]}
                            isOpen={openMenu === key}
                            onOpen={() => setOpenMenu(key)}
                            onClose={() => setOpenMenu(null)}
                        />
                    ))}
                </div>

                {/* Center */}
                <div className="absolute left-1/2 -translate-x-1/2 text-[12px] text-[#cccccc] pointer-events-none flex items-center gap-1.5">
                    <span>{projectName}</span>
                    <span className="text-[#858585]">—</span>
                    <span className="text-[#858585]">CloudIDE</span>
                </div>

                {/* Right */}
                <div className="flex items-center h-full">
                    <button onClick={() => setPaletteOpen(true)} className="px-2 h-full hover:bg-[#505050] text-[#cccccc] transition-colors" title="Search (Ctrl+P)">
                        <VscSearch className="text-sm" />
                    </button>
                    <button
                        onClick={handleRun}
                        className="flex items-center gap-1 px-2 h-full text-[11px] font-medium text-[#4ec9b0] hover:bg-[#505050] transition-colors"
                        title="Run (F5)"
                    >
                        <VscPlay className="text-sm" /> Run
                    </button>
                    <button
                        onClick={onToggleBrowser}
                        className={`px-2 h-full hover:bg-[#505050] transition-colors relative ${showBrowser ? "text-[#4ec9b0] bg-[#505050]" : "text-[#cccccc]"}`}
                        title="Browser Preview"
                    >
                        <VscBrowser className="text-sm" />
                        {showBrowser && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4ec9b0]" />
                        )}
                    </button>
                    <button onClick={cycleTheme} className="px-2 h-full hover:bg-[#505050] text-[#cccccc] transition-colors" title="Cycle Theme">
                        <VscColorMode className="text-sm" />
                    </button>
                    <button onClick={() => setSettingsOpen(true)} className="px-2 h-full hover:bg-[#505050] text-[#cccccc] transition-colors" title="Settings">
                        <VscSettingsGear className="text-sm" />
                    </button>
                    <button onClick={() => navigate("/")} className="px-2 h-full hover:bg-[#505050] text-[#cccccc] transition-colors" title="Dashboard">
                        <VscAccount className="text-sm" />
                    </button>
                </div>
            </header>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </>
    );
};