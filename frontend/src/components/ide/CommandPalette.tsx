import { useState, useEffect, useMemo, useRef } from "react";
import { VscSearch, VscClose } from "react-icons/vsc";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { useFileCacheStore } from "@/store/fileCacheStore";
// import { demoFileContents } from "@/data/demoData";
import { FileIconComponent } from "./FileIconComponent";
import { getExtension } from "@/utils/editor";
import { useEditorSocketStore } from "@/store/editorSocketStore";
import { useTreeStructureStore } from "@/store/treeStructureStore";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveFileTab } = useActiveFileTabStore();
  const { fileCache, setFileContent } = useFileCacheStore();
  const { editorSocket } = useEditorSocketStore();
  const {treeStructure} = useTreeStructureStore();

  const allFiles = useMemo(() => {
    const flatten = (node: any): any[] => {
      const files =  node.isDirectory ? [] : [node];
      if (node.children) {
        node.children.forEach((child: any) => {
          files.push(...flatten(child));
        });
      }
      return files;
    };
    return flatten(treeStructure);
  }, [treeStructure]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allFiles;
    const q = query.toLowerCase();
    return allFiles.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [query, allFiles]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        // Toggle handled by parent
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const openFile = (file: { path: string; name: string }) => {
    const cached = fileCache[file.path];
    if (cached) {
      setActiveFileTab(file.path, cached, file.name);
    } else {
      // const content = demoFileContents[file.path] || `// ${file.name}\n`;
      // setFileContent(file.path, content);
      // setActiveFileTab(file.path, content, file.name);
      editorSocket.emit("ReadFile", {
                pathToFileOrFolder: file.path,
            });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center pt-[15%]" onClick={onClose}>
      <div
        className="w-[520px] max-h-[350px] rounded-md overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#252526", border: "1px solid #3c3c3c" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid #3c3c3c" }}>
          <VscSearch className="text-sm flex-shrink-0" style={{ color: "#858585" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name..."
            className="flex-1 bg-transparent outline-none text-[13px] font-code"
            style={{ color: "#cccccc" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered.length > 0) {
                openFile(filtered[0]);
              }
            }}
          />
          <button onClick={onClose} className="p-0.5 rounded hover:bg-[#3c3c3c]">
            <VscClose className="text-sm" style={{ color: "#858585" }} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px]" style={{ color: "#858585" }}>
              No files found
            </div>
          ) : (
            filtered.map((file) => (
              <button
                key={file.path}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#37373d] transition-colors"
                onClick={() => openFile(file)}
              >
                <FileIconComponent extension={getExtension(file.name)} />
                <span className="text-[13px] truncate" style={{ color: "#cccccc" }}>
                  {file.name}
                </span>
                <span className="text-[11px] ml-auto truncate" style={{ color: "#858585" }}>
                  {file.dir}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
