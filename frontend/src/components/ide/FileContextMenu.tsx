import { useEffect, useRef } from "react";
import { useContextMenuStore } from "@/store/contextMenuStore";
import { useTreeStructureStore } from "@/store/treeStructureStore";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { useEditorSocketStore } from "@/store/editorSocketStore";
import { VscNewFile, VscNewFolder, VscEdit, VscTrash, VscCopy, VscFiles } from "react-icons/vsc";
import { toast } from "sonner";

export const FileContextMenu = () => {
    const { isOpen, x, y, path, type, targetName, closeMenu } = useContextMenuStore();
    const { startCreatingNode, startRenamingNode } = useTreeStructureStore();
    const { closeTab } = useActiveFileTabStore();
    const { editorSocket } = useEditorSocketStore();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const close = () => closeMenu();
        const keyClose = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
        // Delay so the current click that opened the menu doesn't close it immediately
        const t = setTimeout(() => {
            window.addEventListener("click", close);
            window.addEventListener("keydown", keyClose);
        }, 50);
        return () => {
            clearTimeout(t);
            window.removeEventListener("click", close);
            window.removeEventListener("keydown", keyClose);
        };
    }, [isOpen, closeMenu]);

    if (!isOpen || !path) return null;

    const handleDelete = () => {
        if (!editorSocket) { toast.error("Editor not connected"); closeMenu(); return; }

        if (type === "file") {
            editorSocket.emit("DeleteFile", { pathToFileOrFolder: path });
            closeTab(path);
        } else {
            editorSocket.emit("DeleteFolder", { pathToFileOrFolder: path });
        }
        closeMenu();
    };

    const handleRename = () => {
        startRenamingNode(path, targetName || "", type ?? "file");
        closeMenu();
    };

    const items = [
        ...(type === "folder" ? [
            {
                label:  "New File",
                icon:   <VscNewFile className="text-xs" />,
                action: () => { startCreatingNode(path, "file"); closeMenu(); },
            },
            {
                label:  "New Folder",
                icon:   <VscNewFolder className="text-xs" />,
                action: () => { startCreatingNode(path, "folder"); closeMenu(); },
            },
            { divider: true },
        ] : []),
        {
            label:  "Copy Path",
            icon:   <VscCopy className="text-xs" />,
            action: () => {
                navigator.clipboard.writeText(path);
                toast.success("Path copied");
                closeMenu();
            },
        },
        {
            label:  "Copy Relative Path",
            icon:   <VscFiles className="text-xs" />,
            action: () => {
                // Strip everything up to and including the project folder name
                const rel = path.replace(/^.*?\/workspace\/[^/]+\//, "");
                navigator.clipboard.writeText(rel);
                toast.success("Relative path copied");
                closeMenu();
            },
        },
        { divider: true },
        {
            label:  "Rename",
            icon:   <VscEdit className="text-xs" />,
            action: handleRename,
        },
        {
            label:       "Delete",
            icon:        <VscTrash className="text-xs" />,
            destructive: true,
            action:      handleDelete,
        },
    ];

    return (
        <div
            ref={ref}
            className="fixed z-[300] min-w-[180px] rounded-md py-1 shadow-xl"
            style={{
                top:        y,
                left:       x,
                background: "#252526",
                border:     "1px solid #454545",
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, i) =>
                "divider" in item ? (
                    <div key={i} className="my-1 h-px" style={{ background: "#3c3c3c" }} />
                ) : (
                    <button
                        key={i}
                        onClick={item.action}
                        className="w-full flex items-center gap-2 px-3 py-[5px] text-[12px] text-left transition-colors hover:bg-[#094771]"
                        style={{ color: "destructive" in item && item.destructive ? "#f44747" : "#cccccc" }}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                )
            )}
        </div>
    );
};