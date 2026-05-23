import { useState, useRef, useEffect } from "react";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { FaFolder, FaFolderOpen } from "react-icons/fa";
import { VscFile, VscNewFile, VscNewFolder } from "react-icons/vsc";
import { TreeNodeData } from "@/utils/tree";
import { getExtension } from "@/utils/editor";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { useFileCacheStore } from "@/store/fileCacheStore";
import { useTreeStructureStore } from "@/store/treeStructureStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import { FileIconComponent } from "./FileIconComponent";
import { useEditorSocketStore } from "@/store/editorSocketStore";
import { toast } from "sonner";

interface TreeNodeProps {
    node:   TreeNodeData;
    depth?: number;
}

// ── Inline creation/rename input ─────────────────────────────────────────────
const InlineInput = ({
    defaultValue = "",
    placeholder,
    icon,
    depth,
    onCommit,
    onCancel,
}: {
    defaultValue?: string;
    placeholder:   string;
    icon:          React.ReactNode;
    depth:         number;
    onCommit:      (value: string) => void;
    onCancel:      () => void;
}) => {
    const ref   = useRef<HTMLInputElement>(null);
    const [val, setVal] = useState(defaultValue);

    useEffect(() => {
        ref.current?.focus();
        // Select just the name part (before extension) so user can type immediately
        if (defaultValue) {
            const dotIdx = defaultValue.lastIndexOf(".");
            ref.current?.setSelectionRange(0, dotIdx > 0 ? dotIdx : defaultValue.length);
        }
    }, []);

    const commit = () => {
        const trimmed = val.trim();
        if (trimmed) onCommit(trimmed);
        else         onCancel();
    };

    return (
        <div
            className="flex items-center gap-1 py-[2px] pr-2"
            style={{ paddingLeft: `${depth * 16 + 8}px`, background: "#1e1e1e" }}
        >
            <span className="w-3 flex-shrink-0" />
            <span className="text-[#858585] flex-shrink-0 text-xs">{icon}</span>
            <input
                ref={ref}
                value={val}
                placeholder={placeholder}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter")  { e.preventDefault(); commit(); }
                    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
                }}
                onBlur={commit}
                className="flex-1 min-w-0 text-[13px] text-[#cccccc] bg-[#3c3c3c] border border-[#007acc] rounded-sm px-1.5 py-0.5 outline-none font-mono"
                style={{ boxShadow: "0 0 0 1px #007acc" }}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
export const TreeNode = ({ node, depth = 0 }: TreeNodeProps) => {
    const [isOpen, setIsOpen] = useState(depth < 1);
    const isFolder = !!node.children;
    const ext      = getExtension(node.name);

    const { activeFileTab, setActiveFileTab } = useActiveFileTabStore();
    const { editorSocket }                    = useEditorSocketStore();
    const { fileCache, setFileContent }       = useFileCacheStore();
    const {
        creatingNode, renamingNode,
        startCreatingNode,
        stopCreatingNode, stopRenamingNode,
    } = useTreeStructureStore();
    const { openMenu } = useContextMenuStore();

    const isActive      = activeFileTab?.path === node.path;
    const isCreatingHere = creatingNode?.parentPath === node.path;

    // ── File click ────────────────────────────────────────────────────────────
    const handleFileClick = () => {
        if (isFolder) { setIsOpen((o) => !o); return; }

        const cached = fileCache[node.path];
        if (cached !== undefined) {
            setActiveFileTab(node.path, cached, node.name);
            return;
        }
        // Set a placeholder tab immediately so the editor opens right away
        setActiveFileTab(node.path, "", node.name);
        editorSocket?.emit("ReadFile", { pathToFileOrFolder: node.path });
    };

    // ── Context menu ──────────────────────────────────────────────────────────
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        openMenu({ x: e.clientX, y: e.clientY, path: node.path, type: isFolder ? "folder" : "file", targetName: node.name });
    };

    // ── Create file/folder (called when user presses Enter in InlineInput) ────
    const handleCreate = (name: string, type: "file" | "folder") => {
        if (!editorSocket) { toast.error("Editor not connected"); stopCreatingNode(); return; }

        // Build full path: parentPath + "/" + name
        const newPath = node.path.replace(/\\/g, "/").replace(/\/$/, "") + "/" + name;

        if (type === "file") {
            editorSocket.emit("CreateFile", { pathToFileOrFolder: newPath });
        } else {
            editorSocket.emit("CreateFolder", { pathToFileOrFolder: newPath });
        }
        stopCreatingNode();
        // Open the folder so the new item is visible
        setIsOpen(true);
    };

    // ── Rename (called when user presses Enter in rename InlineInput) ─────────
    const handleRename = (newName: string) => {
        if (!editorSocket) { toast.error("Editor not connected"); stopRenamingNode(); return; }

        const parts   = node.path.replace(/\\/g, "/").split("/");
        parts[parts.length - 1] = newName;
        const newPath = parts.join("/");

        if (newPath === node.path) { stopRenamingNode(); return; }

        editorSocket.emit("Rename", { oldPath: node.path, newPath });
        stopRenamingNode();
    };

    const isRenaming = renamingNode?.path === node.path;

    return (
        <div>
            {/* ── Row ──────────────────────────────────────────────────────── */}
            {isRenaming ? (
                // Show inline rename input instead of the normal row
                <InlineInput
                    defaultValue={node.name}
                    placeholder={node.name}
                    icon={isFolder ? <FaFolder className="text-warning" /> : <FileIconComponent extension={ext} />}
                    depth={depth}
                    onCommit={handleRename}
                    onCancel={stopRenamingNode}
                />
            ) : (
                <div
                    className={`flex items-center gap-1.5 py-[3px] cursor-pointer text-[13px]
                        select-none transition-colors duration-75 group/row
                        ${isActive
                            ? "bg-[#094771] text-[#ffffff]"
                            : "text-[#cccccc] hover:bg-[#2a2d2e]"
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: "8px" }}
                    onClick={handleFileClick}
                    onContextMenu={handleContextMenu}
                >
                    {/* Arrow + icon */}
                    {isFolder ? (
                        <>
                            <span className="text-[#858585] text-[10px] w-3 flex-shrink-0">
                                {isOpen ? <IoIosArrowDown /> : <IoIosArrowForward />}
                            </span>
                            {isOpen
                                ? <FaFolderOpen className="text-[#dcb67a] text-sm flex-shrink-0" />
                                : <FaFolder     className="text-[#dcb67a] text-sm flex-shrink-0" />
                            }
                        </>
                    ) : (
                        <>
                            <span className="w-3 flex-shrink-0" />
                            <FileIconComponent extension={ext} />
                        </>
                    )}

                    <span className="flex-1 truncate">{node.name}</span>

                    {/* Inline new-file / new-folder buttons on folder hover */}
                    {isFolder && (
                        <span className="hidden group-hover/row:flex items-center gap-0.5 flex-shrink-0">
                            <span
                                title="New File"
                                onClick={(e) => { e.stopPropagation(); startCreatingNode(node.path, "file"); setIsOpen(true); }}
                                className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]"
                            >
                                <VscNewFile className="text-xs" />
                            </span>
                            <span
                                title="New Folder"
                                onClick={(e) => { e.stopPropagation(); startCreatingNode(node.path, "folder"); setIsOpen(true); }}
                                className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]"
                            >
                                <VscNewFolder className="text-xs" />
                            </span>
                        </span>
                    )}
                </div>
            )}

            {/* ── Children ─────────────────────────────────────────────────── */}
            {isFolder && isOpen && (
                <div>
                    {node.children?.map((child) => (
                        <TreeNode key={child.path} node={child} depth={depth + 1} />
                    ))}

                    {/* Inline create input — shown when this folder is the target */}
                    {isCreatingHere && creatingNode && (
                        <InlineInput
                            placeholder={creatingNode.type === "file" ? "filename.ext" : "folder-name"}
                            icon={
                                creatingNode.type === "file"
                                    ? <VscFile className="text-[#858585]" />
                                    : <FaFolder className="text-[#dcb67a]" />
                            }
                            depth={depth + 1}
                            onCommit={(name) => handleCreate(name, creatingNode.type)}
                            onCancel={stopCreatingNode}
                        />
                    )}
                </div>
            )}
        </div>
    );
};