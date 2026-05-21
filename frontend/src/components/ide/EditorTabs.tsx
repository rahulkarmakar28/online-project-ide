import { VscClose } from "react-icons/vsc";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";
import { FileIconComponent } from "./FileIconComponent";
import { getExtension } from "@/utils/editor";

export const EditorTabs = () => {
  const { openTabs, activeFileTab, setActiveFileTab, closeTab } = useActiveFileTabStore();

  if (openTabs.length === 0) return null;

  return (
    <div className="flex overflow-x-auto" style={{ background: "#252526" }}>
      {openTabs.map((tab) => {
        const isActive = activeFileTab?.path === tab.path;
        return (
          <div
            key={tab.path}
            className={`group flex items-center gap-1.5 px-3 h-[35px] text-[13px] cursor-pointer transition-colors min-w-0 shrink-0`}
            style={{
              background: isActive ? "#1e1e1e" : "transparent",
              color: isActive ? "#ffffff" : "#969696",
              borderRight: "1px solid #1e1e1e",
              borderTop: isActive ? "1px solid #007acc" : "1px solid transparent",
            }}
            onClick={() => setActiveFileTab(tab.path, tab.value, tab.name)}
          >
            <FileIconComponent extension={getExtension(tab.name)} />
            <span className="truncate max-w-[120px]">{tab.name}</span>
            <button
              className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c] transition-all"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
            >
              <VscClose className="text-xs" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
