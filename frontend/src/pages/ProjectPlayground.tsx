import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { IDEHeader }      from "@/components/ide/IDEHeader";
import { FileExplorer }   from "@/components/ide/FileExplorer";
import { CodeEditor }     from "@/components/ide/CodeEditor";
import { TerminalPanel }  from "@/components/ide/TerminalPanel";
import { StatusBar }      from "@/components/ide/StatusBar";
import { BrowserPreview } from "@/components/ide/BrowserPreview";
import { useTreeStructureStore }  from "@/store/treeStructureStore";
import { useEditorSocketStore }   from "@/store/editorSocketStore";
import { useTerminalSocketStore } from "@/store/terminalSocketStore";
import { useThemeApplier }        from "@/hooks/useThemeApplier";
import { usePortStore }           from "@/store/portStore";
import { getProjectTreeApi }      from "@/apis/projects";
import { sortTree }               from "@/utils/tree";
import { useProjectStore }        from "@/store/projectStore";

const TERMINAL_WS_URL = import.meta.env.VITE_WORKER_TERMINAL_URL || "ws://localhost:4000";
const EDITOR_WS_URL   = import.meta.env.VITE_WORKER_EDITOR_URL   || "http://localhost:5000";

const ProjectPlayground = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    useThemeApplier();

    const { setProjectId, setTreeStructure } = useTreeStructureStore();
    const { setEditorSocket, clearSocket: clearEditor } = useEditorSocketStore();
    const { setTerminalSocket, clearSocket: clearTerminal } = useTerminalSocketStore();
    const { projects } = useProjectStore();
    const { port, setPort } = usePortStore();
    const project = projects.find((p) => p.id === projectId);

    const [sidebarOpen,     setSidebarOpen]     = useState(true);
    const [browserOpen,     setBrowserOpen]     = useState(false);
    const [terminalVisible, setTerminalVisible] = useState(true);
    const [template,        setTemplate]        = useState(project?.template || "react-js");
    const [projectName,     setProjectName]     = useState(project?.name || "");
    const [loading,         setLoading]         = useState(true);

    useEffect(() => {
        if (!projectId) { navigate("/"); return; }

        setProjectId(projectId);
        setPort(null);

        let ws:     WebSocket | null         = null;
        let socket: ReturnType<typeof io> | null = null;

        getProjectTreeApi(projectId)
            .then((data) => {
                const resolvedName     = data?.name     || project?.name || `project-${projectId.slice(0, 6)}`;
                const resolvedTemplate = data?.template || project?.template || "react-js";

                setProjectName(resolvedName);
                setTemplate(resolvedTemplate);

                if (data?.tree) {
                    const sorted      = sortTree(data.tree);
                    const sandboxNode = sorted.children?.[0] ?? sorted;
                    setTreeStructure(sandboxNode);
                }

                // ── Editor socket ─────────────────────────────────────────
                socket = io(`${EDITOR_WS_URL}/editor`, {
                    query: { projectId },
                    auth:  { token: localStorage.getItem("token") ?? "" },
                });

                socket.on("connect", () => {
                    console.log("[editor socket] connected");
                    // Ask worker for the container's mapped host port
                    socket!.emit("GET_PORT", { containerName: `project-${projectId}` });
                });
                socket.on("disconnect", () => console.log("[editor socket] disconnected"));
                socket.on("GET_PORT_SUCCESS", ({ port: p }: { port: number }) => {
                    if (p) setPort(p);
                });

                setEditorSocket(socket);

                // ── Terminal WebSocket ────────────────────────────────────
                const wsUrl = `${TERMINAL_WS_URL}/terminal?projectId=${encodeURIComponent(projectId)}&template=${encodeURIComponent(resolvedTemplate)}&name=${encodeURIComponent(resolvedName)}`;
                console.log("[terminal ws] connecting:", wsUrl);

                ws = new WebSocket(wsUrl);
                ws.onopen  = () => console.log("[terminal ws] connected");
                ws.onerror = (e) => console.error("[terminal ws] error", e);
                ws.onclose = () => console.log("[terminal ws] closed");

                // Worker sends { type:"preview-port", port:XXXX } once container starts
                ws.addEventListener("message", (e) => {
                    try {
                        const msg = JSON.parse(
                            typeof e.data === "string" ? e.data : new TextDecoder().decode(e.data)
                        );
                        if (msg?.type === "preview-port" && msg.port) {
                            setPort(Number(msg.port));
                        }
                    } catch {
                        // binary terminal data — ignore JSON parse errors
                    }
                });

                setTerminalSocket(ws);
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        return () => {
            socket?.disconnect();
            ws?.close();
            clearEditor();
            clearTerminal();
            setPort(null);
        };
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: "#1e1e1e" }}>
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#007acc] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[#858585] text-sm">Loading project…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#1e1e1e" }}>
            <IDEHeader
                projectName={projectName || `project-${projectId?.slice(0, 6)}`}
                template={template}
                onToggleSidebar={() => setSidebarOpen((s) => !s)}
                onToggleBrowser={() => setBrowserOpen((b) => !b)}
                onToggleTerminal={() => setTerminalVisible((v) => !v)}
                showBrowser={browserOpen}
            />

            <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && (
                    <div
                        className="w-[48px] min-w-[48px] flex flex-col items-center py-2 gap-1"
                        style={{ background: "#333333", borderRight: "1px solid #252526" }}
                    />
                )}

                {sidebarOpen && (
                    <div
                        className="w-60 min-w-[200px] overflow-hidden"
                        style={{ background: "#252526", borderRight: "1px solid #1e1e1e" }}
                    >
                        <FileExplorer />
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {terminalVisible ? (
                            <ResizablePanelGroup orientation="vertical" className="w-full h-full">
                                <ResizablePanel defaultSize={68} minSize={25}>
                                    <CodeEditor />
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                                <ResizablePanel defaultSize={32} minSize={10}>
                                    <TerminalPanel />
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        ) : (
                            <CodeEditor />
                        )}
                    </div>

                    {browserOpen && (
                        <div className="w-[420px] min-w-[300px]" style={{ borderLeft: "1px solid #252526" }}>
                            <BrowserPreview
                                port={port}
                                onClose={() => setBrowserOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <StatusBar />
        </div>
    );
};

export default ProjectPlayground;