import { useCallback } from "react";
import { VscNewFile, VscNewFolder, VscRefresh, VscCollapseAll } from "react-icons/vsc";
import { TreeNode } from "./TreeNode";
import { FileContextMenu } from "./FileContextMenu";
import { useTreeStructureStore } from "@/store/treeStructureStore";
import { useEditorSocketStore } from "@/store/editorSocketStore";
import { toast } from "sonner";

export const FileExplorer = () => {
    const { treeStructure, startCreatingNode, refreshTree } = useTreeStructureStore();
    const { editorSocket } = useEditorSocketStore();

    const handleNewFile = useCallback(() => {
        if (treeStructure) startCreatingNode(treeStructure.path, "file");
    }, [treeStructure, startCreatingNode]);

    const handleNewFolder = useCallback(() => {
        if (treeStructure) startCreatingNode(treeStructure.path, "folder");
    }, [treeStructure, startCreatingNode]);

    const handleRefresh = useCallback(async () => {
        await refreshTree();
        toast.success("Explorer refreshed");
    }, [refreshTree]);

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ background: "#252526" }}>
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 h-[35px] min-h-[35px]"
                style={{ borderBottom: "1px solid #1e1e1e" }}
            >
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#bbbbbb" }}>
                    Explorer
                </span>
                <div className="flex gap-0.5">
                    <button onClick={handleNewFile}   className="p-1 rounded hover:bg-[#37373d] text-[#858585]" title="New File">
                        <VscNewFile className="text-sm" />
                    </button>
                    <button onClick={handleNewFolder} className="p-1 rounded hover:bg-[#37373d] text-[#858585]" title="New Folder">
                        <VscNewFolder className="text-sm" />
                    </button>
                    <button onClick={handleRefresh}   className="p-1 rounded hover:bg-[#37373d] text-[#858585]" title="Refresh">
                        <VscRefresh className="text-sm" />
                    </button>
                    <button className="p-1 rounded hover:bg-[#37373d] text-[#858585]" title="Collapse All">
                        <VscCollapseAll className="text-sm" />
                    </button>
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-0.5" style={{ background: "#252526" }}>
                {treeStructure ? (
                    <TreeNode node={treeStructure} />
                ) : (
                    <div className="px-3 py-4 text-xs" style={{ color: "#858585" }}>
                        Loading project files…
                    </div>
                )}
            </div>

            <FileContextMenu />
        </div>
    );
};
