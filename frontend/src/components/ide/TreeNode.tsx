import { useState } from "react";
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { FaFolder, FaFolderOpen } from "react-icons/fa";
import { TreeNodeData } from "@/utils/tree";
import { getExtension } from "@/utils/editor";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { useFileCacheStore } from "@/store/fileCacheStore";
import { useTreeStructureStore } from "@/store/treeStructureStore";
import { useContextMenuStore } from "@/store/contextMenuStore";
import { FileIconComponent } from "./FileIconComponent";
import { useEditorSocketStore } from "@/store/editorSocketStore";

interface TreeNodeProps {
    node: TreeNodeData;
    depth?: number;
}

export const TreeNode = ({ node, depth = 0 }: TreeNodeProps) => {
    const [isOpen, setIsOpen] = useState(depth < 1);
    const isFolder = !!node.children;
    const ext = getExtension(node.name);
    const { activeFileTab, setActiveFileTab } = useActiveFileTabStore();
    const { editorSocket } = useEditorSocketStore();
    const { fileCache, setFileContent } = useFileCacheStore();
    const { creatingNode, renamingNode, stopCreatingNode, stopRenamingNode } =
        useTreeStructureStore();
    const { openMenu } = useContextMenuStore();
    const isActive = activeFileTab?.path === node.path;

    const handleFileClick = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
            return;
        }

        // If already cached, open immediately — no round-trip needed
        const cached = fileCache[node.path];
        if (cached !== undefined) {
            setActiveFileTab(node.path, cached, node.name);
            return;
        }

        // FIX: Set a placeholder tab immediately so the editor panel opens
        // and the ReadFileSuccess handler knows which tab to update.
        setActiveFileTab(node.path, "", node.name);

        // Ask the server for the real content
        editorSocket?.emit("ReadFile", { pathToFileOrFolder: node.path });
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        openMenu({
            x: e.clientX,
            y: e.clientY,
            path: node.path,
            type: isFolder ? "folder" : "file",
            targetName: node.name,
        });
    };

    return (
        <div>
            <div
                className={`flex items-center gap-1.5 px-2 py-[3px] cursor-pointer text-[13px] transition-colors duration-100
          ${isActive ? "bg-accent text-foreground" : "text-sidebar-foreground hover:bg-accent/50"}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleFileClick}
                onContextMenu={handleContextMenu}
            >
                {isFolder ? (
                    <>
                        <span className="text-muted-foreground text-[10px] w-3">
                            {isOpen ? <IoIosArrowDown /> : <IoIosArrowForward />}
                        </span>
                        {isOpen ? (
                            <FaFolderOpen className="text-warning text-sm flex-shrink-0" />
                        ) : (
                            <FaFolder className="text-warning text-sm flex-shrink-0" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-3" />
                        <FileIconComponent extension={ext} />
                    </>
                )}

                {renamingNode?.path === node.path ? (
                    <input
                        autoFocus
                        defaultValue={node.name}
                        className="bg-input text-foreground border border-border text-xs px-1 rounded font-code"
                        onBlur={() => stopRenamingNode()}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Escape") stopRenamingNode();
                        }}
                    />
                ) : (
                    <span className="truncate">{node.name}</span>
                )}
            </div>

            {isFolder && isOpen && (
                <div>
                    {node.children?.map((child) => (
                        <TreeNode key={child.path} node={child} depth={depth + 1} />
                    ))}
                    {creatingNode?.parentPath === node.path && (
                        <div
                            style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                            className="py-0.5"
                        >
                            <input
                                autoFocus
                                placeholder={`New ${creatingNode.type}...`}
                                className="bg-input text-foreground border border-primary text-xs px-1.5 py-0.5 rounded font-code w-32"
                                onBlur={() => stopCreatingNode()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === "Escape") stopCreatingNode();
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
