import { useEffect, useRef } from "react";
import { useContextMenuStore } from "@/store/contextMenuStore";
import { useTreeStructureStore } from "@/store/treeStructureStore";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { VscNewFile, VscNewFolder, VscEdit, VscTrash, VscCopy, VscFiles } from "react-icons/vsc";
import { toast } from "sonner";

export const FileContextMenu = () => {
  const { isOpen, x, y, path, type, targetName, closeMenu } = useContextMenuStore();
  const { startCreatingNode, startRenamingNode } = useTreeStructureStore();
  const { closeTab } = useActiveFileTabStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handle = () => closeMenu();
    const keyHandle = (e: KeyboardEvent) => { if (e.key === "Escape") handle(); };
    window.addEventListener("click", handle);
    window.addEventListener("keydown", keyHandle);
    return () => {
      window.removeEventListener("click", handle);
      window.removeEventListener("keydown", keyHandle);
    };
  }, [isOpen, closeMenu]);

  if (!isOpen || !path) return null;

  const items = [
    ...(type === "folder"
      ? [
          {
            label: "New File",
            icon: <VscNewFile className="text-xs" />,
            action: () => { startCreatingNode(path, "file"); closeMenu(); },
          },
          {
            label: "New Folder",
            icon: <VscNewFolder className="text-xs" />,
            action: () => { startCreatingNode(path, "folder"); closeMenu(); },
          },
          { divider: true },
        ]
      : []),
    {
      label: "Copy Path",
      icon: <VscCopy className="text-xs" />,
      action: () => {
        navigator.clipboard.writeText(path);
        toast.success("Path copied to clipboard");
        closeMenu();
      },
    },
    {
      label: "Copy Relative Path",
      icon: <VscFiles className="text-xs" />,
      action: () => {
        navigator.clipboard.writeText(path.replace("/my-react-app/", ""));
        toast.success("Relative path copied");
        closeMenu();
      },
    },
    { divider: true },
    {
      label: "Rename",
      icon: <VscEdit className="text-xs" />,
      action: () => {
        startRenamingNode(path, targetName || "", type ?? "file");
        closeMenu();
      },
    },
    {
      label: "Delete",
      icon: <VscTrash className="text-xs" />,
      destructive: true,
      action: () => {
        if (type === "file") {
          closeTab(path);
        }
        toast.success(`Deleted ${targetName}`);
        closeMenu();
      },
    },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[300] min-w-[180px] rounded-md py-1 shadow-xl animate-fade-in"
      style={{ top: y, left: x, background: "#252526", border: "1px solid #3c3c3c" }}
    >
      {items.map((item, i) =>
        "divider" in item && item.divider ? (
          <div key={i} className="my-1 h-px" style={{ background: "#3c3c3c" }} />
        ) : (
          <button
            key={i}
            onClick={"action" in item ? item.action : undefined}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors hover:bg-[#094771]`}
            style={{ color: "destructive" in item && item.destructive ? "#f44747" : "#cccccc" }}
          >
            {"icon" in item && item.icon}
            {"label" in item && item.label}
          </button>
        )
      )}
    </div>
  );
};
