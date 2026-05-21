import { VscSourceControl, VscError, VscWarning, VscBell, VscCheck, VscRemote } from "react-icons/vsc";
import { useActiveFileTabStore } from "@/store/activeFileTabStore";

export const StatusBar = () => {
  const { activeFileTab } = useActiveFileTabStore();

  return (
    <footer
      className="flex items-center justify-between h-[22px] min-h-[22px] px-2 text-[11px] select-none"
      style={{ background: "#007acc", color: "#ffffff" }}
    >
      <div className="flex items-center gap-0">
        <span className="flex items-center gap-1 cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px]">
          <VscRemote className="text-xs" />
          CloudIDE
        </span>
        <span className="flex items-center gap-1 cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px]">
          <VscSourceControl className="text-xs" />
          main
        </span>
        <span className="flex items-center gap-1 cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px]">
          <VscError className="text-[10px]" /> 0
          <VscWarning className="text-[10px] ml-1" /> 0
        </span>
      </div>

      <div className="flex items-center gap-0">
        {activeFileTab && (
          <>
            <span className="cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px] flex items-center">
              Ln 1, Col 1
            </span>
            <span className="cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px] flex items-center">
              Spaces: 2
            </span>
            <span className="cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px] flex items-center">
              UTF-8
            </span>
            <span className="cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px] flex items-center">
              {activeFileTab.extension?.replace(".", "").toUpperCase() || "Plain Text"}
            </span>
          </>
        )}
        <span className="flex items-center gap-1 cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px]">
          <VscCheck className="text-xs" /> Prettier
        </span>
        <span className="cursor-pointer hover:bg-[#ffffff20] px-1.5 h-[22px] flex items-center">
          <VscBell className="text-xs" />
        </span>
      </div>
    </footer>
  );
};
