import { useState, useRef, useEffect, useCallback } from "react";
import {
    VscRefresh, VscArrowLeft, VscArrowRight, VscChromeClose,
    VscLock, VscLinkExternal, VscDebugStart,
} from "react-icons/vsc";

interface BrowserPreviewProps {
    port?:    number | null;
    onClose?: () => void;
}

export const BrowserPreview = ({ port, onClose }: BrowserPreviewProps) => {
    const origin   = port ? `http://localhost:${port}` : "";
    const [url,    setUrl]    = useState(origin ? origin + "/" : "");
    const [input,  setInput]  = useState(origin ? origin + "/" : "");
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const keyRef    = useRef(0);  // force iframe remount on navigate

    // Reset when port becomes available
    useEffect(() => {
        if (!port) return;
        const base = `http://localhost:${port}/`;
        setUrl(base);
        setInput(base);
        setError(false);
        setLoading(true);
        keyRef.current++;
    }, [port]);

    const navigate = useCallback((target: string) => {
        let u = target.trim();
        if (u && !/^https?:\/\//i.test(u)) u = origin + (u.startsWith("/") ? u : "/" + u);
        setUrl(u);
        setInput(u);
        setError(false);
        setLoading(true);
        keyRef.current++;
    }, [origin]);

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); navigate(input); };
    const handleRefresh = () => navigate(url);

    if (!port) {
        return (
            <div className="flex flex-col h-full" style={{ background: "#1e1e1e" }}>
                <div className="flex items-center justify-between h-[35px] min-h-[35px] px-3"
                    style={{ background: "#252526", borderBottom: "1px solid #1e1e1e" }}>
                    <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "#e0e0e0" }}>Browser Preview</span>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585]"><VscChromeClose /></button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "#858585" }}>
                    <VscDebugStart className="text-4xl" />
                    <p className="text-sm font-medium" style={{ color: "#cccccc" }}>No preview available</p>
                    <p className="text-xs text-center px-4">Run your dev server in the terminal, then the preview will load automatically.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ background: "#1e1e1e" }}>
            {/* Header */}
            <div className="flex items-center justify-between h-[35px] min-h-[35px] px-2"
                style={{ background: "#252526", borderBottom: "1px solid #1e1e1e" }}>
                <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: "#e0e0e0" }}>Browser Preview</span>
                <div className="flex items-center gap-0.5">
                    <button title="Open in new tab" onClick={() => window.open(url, "_blank")}
                        className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]">
                        <VscLinkExternal className="text-xs" />
                    </button>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]">
                        <VscChromeClose className="text-sm" />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <form onSubmit={handleSubmit} className="flex items-center gap-1 px-2 py-1"
                style={{ background: "#2d2d2d", borderBottom: "1px solid #1e1e1e" }}>
                <button type="button" onClick={() => iframeRef.current?.contentWindow?.history.back()}
                    className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585]"><VscArrowLeft className="text-xs" /></button>
                <button type="button" onClick={() => iframeRef.current?.contentWindow?.history.forward()}
                    className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585]"><VscArrowRight className="text-xs" /></button>
                <button type="button" onClick={handleRefresh}
                    className={`p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] ${loading ? "animate-spin" : ""}`}>
                    <VscRefresh className="text-xs" />
                </button>
                <div className="flex-1 flex items-center gap-1 rounded px-2 py-0.5" style={{ background: "#3c3c3c" }}>
                    <VscLock className="text-[10px] flex-shrink-0" style={{ color: "#858585" }} />
                    <input value={input} onChange={e => setInput(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-[11px] font-mono" style={{ color: "#cccccc" }}
                        spellCheck={false} />
                </div>
            </form>

            {loading && (
                <div className="h-[2px]" style={{ background: "#1e1e1e" }}>
                    <div className="h-full" style={{ background: "#007acc", width: "70%", transition: "width 0.5s" }} />
                </div>
            )}

            <div className="flex-1 relative overflow-hidden">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
                        style={{ background: "#1e1e1e", color: "#858585" }}>
                        <VscDebugStart className="text-4xl" />
                        <p className="text-sm font-medium" style={{ color: "#cccccc" }}>Can't reach localhost:{port}</p>
                        <p className="text-xs text-center">Start your dev server in the terminal, then refresh.</p>
                        <button onClick={handleRefresh}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white"
                            style={{ background: "#0e639c" }}>
                            <VscRefresh /> Retry
                        </button>
                    </div>
                ) : (
                    /* KEY CHANGE: use key prop to force full remount on navigation
                       This is needed because browsers block cross-origin iframe navigation
                       to localhost when the parent is on a different port. Remounting
                       creates a fresh iframe with the new src instead of navigating.
                       
                       Also: referrerPolicy="no-referrer" and allow="*" help with
                       some browsers that block localhost iframes by default. */
                    <iframe
                        key={keyRef.current}
                        ref={iframeRef}
                        src={url || undefined}
                        title="preview"
                        onLoad={() => { setLoading(false); setError(false); }}
                        onError={() => { setLoading(false); setError(true); }}
                        className="w-full h-full border-0"
                        style={{ background: "#ffffff" }}
                        referrerPolicy="no-referrer"
                        allow="cross-origin-isolated; camera; microphone; fullscreen"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                    />
                )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-2 h-[20px] min-h-[20px] text-[10px]"
                style={{ background: "#252526", borderTop: "1px solid #1e1e1e", color: "#858585" }}>
                <span className="truncate max-w-[80%]">{url}</span>
                <span>{loading ? "Loading…" : error ? "Error" : "Ready"}</span>
            </div>
        </div>
    );
};