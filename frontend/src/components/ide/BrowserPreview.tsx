import {
    useState,
    useRef,
    useCallback,
    useEffect,
} from "react";

import {
    VscRefresh,
    VscArrowLeft,
    VscArrowRight,
    VscChromeClose,
    VscLock,
    VscLinkExternal,
    VscDebugStart,
} from "react-icons/vsc";

interface BrowserPreviewProps {
    projectName?: string;
    port?: number | null;
    onClose?: () => void;
}

export const BrowserPreview = ({
    projectName,
    port,
    onClose,
}: BrowserPreviewProps) => {

    const origin =
        port
            ? `http://localhost:${port}`
            : "";

    const [inputUrl, setInputUrl] =
        useState(
            origin ? origin + "/" : "",
        );

    const [iframeUrl, setIframeUrl] =
        useState(
            origin ? origin + "/" : "",
        );

    const [isLoading, setIsLoading] =
        useState(false);

    const [loadError, setLoadError] =
        useState(false);

    const iframeRef =
        useRef<HTMLIFrameElement>(null);

    const noServer =
        !projectName || !port;

    // reset when port changes
    useEffect(() => {

        if (!port) return;

        const url =
            `http://localhost:${port}/`;

        setInputUrl(url);

        setIframeUrl(url);

        setLoadError(false);

        setIsLoading(true);

    }, [port]);

    const navigate = useCallback(
        (url: string) => {

            if (!origin) return;

            let target = url.trim();

            if (
                !/^https?:\/\//i.test(
                    target,
                )
            ) {

                target =
                    origin +
                    (
                        target.startsWith("/")
                            ? target
                            : "/" + target
                    );
            }

            setInputUrl(target);

            setIframeUrl(target);

            setIsLoading(true);

            setLoadError(false);

        },
        [origin],
    );

    const handleSubmit = (
        e: React.FormEvent,
    ) => {

        e.preventDefault();

        navigate(inputUrl);
    };

    const handleRefresh = () => {

        if (noServer) return;

        setIsLoading(true);

        setLoadError(false);

        const current =
            iframeUrl;

        setIframeUrl("");

        requestAnimationFrame(() => {
            setIframeUrl(current);
        });
    };

    const handleBack = () => {

        iframeRef.current
            ?.contentWindow
            ?.history
            .back();
    };

    const handleForward = () => {

        iframeRef.current
            ?.contentWindow
            ?.history
            .forward();
    };

    const handleLoad = () => {

        setIsLoading(false);

        setLoadError(false);

        try {

            const actual =
                iframeRef.current
                    ?.contentWindow
                    ?.location
                    ?.href;

            if (
                actual &&
                actual !== "about:blank"
            ) {

                setInputUrl(actual);
            }

        } catch {
            // ignore cross-origin
        }
    };

    const handleError = () => {

        setIsLoading(false);

        setLoadError(true);
    };

    return (

        <div
            className="flex flex-col h-full"
            style={{
                background: "#1e1e1e",
            }}
        >

            {/* HEADER */}
            <div
                className="flex items-center justify-between h-[35px] min-h-[35px] px-2"
                style={{
                    background: "#252526",
                    borderBottom:
                        "1px solid #1e1e1e",
                }}
            >

                <span
                    className="text-[11px] uppercase tracking-wide font-medium"
                    style={{
                        color: "#e0e0e0",
                    }}
                >
                    Browser Preview
                </span>

                <div className="flex items-center gap-0.5">

                    <button
                        className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]"
                        title="Open in new tab"
                        disabled={noServer}
                        onClick={() => {

                            if (!noServer) {

                                window.open(
                                    iframeUrl,
                                    "_blank",
                                );
                            }
                        }}
                    >
                        <VscLinkExternal className="text-xs" />
                    </button>

                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]"
                        title="Close"
                    >
                        <VscChromeClose className="text-sm" />
                    </button>

                </div>
            </div>

            {/* NAVBAR */}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-1.5 px-2 py-1"
                style={{
                    background: "#252526",
                    borderBottom:
                        "1px solid #1e1e1e",
                }}
            >

                <button
                    type="button"
                    onClick={handleBack}
                    disabled={noServer}
                    className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585]"
                    title="Back"
                >
                    <VscArrowLeft className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={handleForward}
                    disabled={noServer}
                    className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585]"
                    title="Forward"
                >
                    <VscArrowRight className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={noServer}
                    className={`p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] ${
                        isLoading
                            ? "animate-spin"
                            : ""
                    }`}
                    title="Refresh"
                >
                    <VscRefresh className="text-xs" />
                </button>

                {/* ADDRESS BAR */}
                <div
                    className="flex-1 flex items-center gap-1.5 rounded px-2 py-0.5"
                    style={{
                        background: "#3c3c3c",
                    }}
                >

                    <VscLock
                        className="text-[10px] flex-shrink-0"
                        style={{
                            color: "#858585",
                        }}
                    />

                    <input
                        value={inputUrl}
                        onChange={(e) =>
                            setInputUrl(
                                e.target.value,
                            )
                        }
                        className="flex-1 bg-transparent outline-none text-[11px] font-mono"
                        style={{
                            color: "#cccccc",
                        }}
                        spellCheck={false}
                        disabled={noServer}
                        placeholder="Waiting for dev server..."
                    />

                </div>
            </form>

            {/* LOADING BAR */}
            {isLoading && (

                <div
                    className="h-[2px]"
                    style={{
                        background: "#1e1e1e",
                    }}
                >

                    <div
                        className="h-full"
                        style={{
                            background:
                                "#007acc",

                            width: "70%",

                            transition:
                                "width 0.4s ease-out",
                        }}
                    />
                </div>
            )}

            {/* CONTENT */}
            <div
                className="flex-1 relative overflow-hidden"
            >

                {noServer ? (

                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                        style={{
                            background:
                                "#1e1e1e",
                        }}
                    >

                        <VscDebugStart
                            className="text-4xl mb-3"
                            style={{
                                color:
                                    "#858585",
                            }}
                        />

                        <p
                            className="text-sm font-medium mb-1"
                            style={{
                                color:
                                    "#cccccc",
                            }}
                        >
                            No dev server running
                        </p>

                        <p
                            className="text-xs mb-2"
                            style={{
                                color:
                                    "#858585",
                            }}
                        >
                            Run
                            {" "}
                            <code
                                className="px-1 py-0.5 rounded text-[11px]"
                                style={{
                                    background:
                                        "#2d2d2d",

                                    color:
                                        "#9cdcfe",
                                }}
                            >
                                npm run dev
                            </code>
                        </p>

                    </div>

                ) : loadError ? (

                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                        style={{
                            background:
                                "#1e1e1e",
                        }}
                    >

                        <VscDebugStart
                            className="text-4xl mb-3"
                            style={{
                                color:
                                    "#858585",
                            }}
                        />

                        <p
                            className="text-sm font-medium mb-1"
                            style={{
                                color:
                                    "#cccccc",
                            }}
                        >
                            Preview unavailable
                        </p>

                        <p
                            className="text-xs mb-4"
                            style={{
                                color:
                                    "#858585",
                            }}
                        >
                            Start your dev server
                            and refresh.
                        </p>

                        <button
                            onClick={
                                handleRefresh
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                            style={{
                                background:
                                    "#0e639c",

                                color:
                                    "#ffffff",
                            }}
                        >

                            <VscRefresh />

                            Retry

                        </button>

                    </div>

                ) : (

                    <iframe
                        ref={iframeRef}
                        src={iframeUrl}
                        title="preview"
                        onLoad={handleLoad}
                        onError={handleError}
                        className="w-full h-full border-0"
                        style={{
                            background:
                                "#ffffff",
                        }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    />
                )}
            </div>

            {/* STATUS BAR */}
            <div
                className="flex items-center justify-between px-2 h-[22px] min-h-[22px] text-[10px]"
                style={{
                    background: "#252526",

                    borderTop:
                        "1px solid #1e1e1e",

                    color: "#858585",
                }}
            >

                <span>
                    {
                        noServer
                            ? "Waiting for server..."
                            : iframeUrl
                    }
                </span>

                <span>
                    {
                        noServer
                            ? "—"
                            : isLoading
                                ? "Loading..."
                                : loadError
                                    ? "Error"
                                    : "Ready"
                    }
                </span>

            </div>
        </div>
    );
};