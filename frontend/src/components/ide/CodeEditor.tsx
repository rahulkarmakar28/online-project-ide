import { useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { useFileCacheStore } from "@/store/fileCacheStore";
import { useThemeStore, themes } from "@/store/themeStore";
import { useEditorSocketStore } from "@/store/editorSocketStore";
import { getLanguageFromExtension } from "@/utils/editor";
import { EditorTabs } from "./EditorTabs";
import { VscCode } from "react-icons/vsc";
import { toast } from "sonner";

export const CodeEditor = () => {
    const { activeFileTab } = useActiveFileTabStore();
    const { fileCache, setFileContent } = useFileCacheStore();
    const { currentTheme, fontSize, minimap, wordWrap } = useThemeStore();
    const { editorSocket } = useEditorSocketStore();
    const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const monacoRef    = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const themeData   = themes.find((t) => t.name === currentTheme);
    const monacoTheme = themeData?.monacoTheme ?? "vs-dark";

    // ── Save function — used by Ctrl+S and auto-save ──────────────────────
    const saveFile = useCallback((path: string, value: string) => {
        if (!editorSocket) return;
        editorSocket.emit("WriteFile", { data: value, pathToFileOrFolder: path });
        toast.success("Saved", { duration: 1000, position: "bottom-right" });
    }, [editorSocket]);

    // ── Ctrl+S keyboard handler ───────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (!activeFileTab) return;
                const current = fileCache[activeFileTab.path] ?? activeFileTab.value ?? "";
                // Cancel any pending debounced save and save immediately
                if (debounceRef.current) clearTimeout(debounceRef.current);
                saveFile(activeFileTab.path, current);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeFileTab, fileCache, saveFile]);

    // ── On each keystroke: update local cache + debounced auto-save ───────
    const handleChange = (value: string | undefined) => {
        if (value === undefined || !activeFileTab) return;
        setFileContent(activeFileTab.path, value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            saveFile(activeFileTab.path, value);
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full">
            <EditorTabs />

            {activeFileTab ? (
                <div ref={containerRef} className="flex-1 overflow-hidden">
                    <Editor
                        key={activeFileTab.path}
                        path={activeFileTab.path}
                        height="100%"
                        language={getLanguageFromExtension(activeFileTab.extension)}
                        value={fileCache[activeFileTab.path] ?? activeFileTab.value ?? ""}
                        theme={monacoTheme}
                        onChange={handleChange}
                        onMount={(editor) => { monacoRef.current = editor; }}
                        options={{
                            fontSize,
                            fontFamily: "'Fira Code', Consolas, Monaco, monospace",
                            fontLigatures: true,
                            minimap: { enabled: minimap },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: "smooth",
                            cursorSmoothCaretAnimation: "on",
                            renderLineHighlight: "all",
                            padding: { top: 8 },
                            bracketPairColorization: { enabled: true },
                            guides: { bracketPairs: true },
                            tabSize: 2,
                            wordWrap: wordWrap ? "on" : "off",
                        }}
                    />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center" style={{ background: "#1e1e1e" }}>
                    <div className="text-center animate-fade-in select-none">
                        <VscCode className="text-6xl mx-auto mb-4" style={{ color: "#3c3c3c" }} />
                        <h2 className="text-xl font-semibold mb-1" style={{ color: "#505050" }}>CloudIDE</h2>
                        <p className="text-sm mb-4" style={{ color: "#3c3c3c" }}>Select a file from the explorer to start editing</p>
                        <div className="text-xs space-y-1" style={{ color: "#3c3c3c" }}>
                            <p>Ctrl+S — save · Ctrl+P — search files</p>
                            <p>Ctrl+` — toggle terminal · F5 — run</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
