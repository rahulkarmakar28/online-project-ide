import { useState, useRef, useEffect } from "react";
import { VscChevronDown } from "react-icons/vsc";

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
}

interface MenuDropdownProps {
  label: string;
  items: MenuItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const MenuDropdown = ({ label, items, isOpen, onOpen, onClose }: MenuDropdownProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          isOpen ? onClose() : onOpen();
        }}
        className={`px-2 h-[30px] text-[12px] transition-colors ${
          isOpen ? "bg-[#505050] text-[#ffffff]" : "text-[#cccccc] hover:bg-[#505050]"
        }`}
      >
        {label}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-[30px] z-[200] min-w-[220px] py-1 rounded-md shadow-xl"
          style={{ background: "#252526", border: "1px solid #3c3c3c" }}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="my-1 h-px" style={{ background: "#3c3c3c" }} />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => {
                  item.action?.();
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-6 py-1 text-[12px] text-left transition-colors
                  ${item.disabled ? "opacity-40 cursor-default" : "hover:bg-[#094771]"}`}
                style={{ color: item.disabled ? "#858585" : "#cccccc" }}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-6 text-[11px]" style={{ color: "#858585" }}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
