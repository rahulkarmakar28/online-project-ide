import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useThemeStore, themes, ThemeName } from "@/store/themeStore";
import { VscColorMode, VscSettingsGear, VscCode, VscTerminal } from "react-icons/vsc";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tabs = [
  { id: "appearance", label: "Appearance", icon: <VscColorMode /> },
  { id: "editor", label: "Editor", icon: <VscCode /> },
  { id: "terminal", label: "Terminal", icon: <VscTerminal /> },
  { id: "general", label: "General", icon: <VscSettingsGear /> },
];

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState("appearance");
  const {
    currentTheme, setTheme,
    fontSize, setFontSize,
    minimap, setMinimap,
    wordWrap, setWordWrap,
  } = useThemeStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-base flex items-center gap-2">
            <VscSettingsGear className="text-primary" /> Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-44 border-r border-border bg-secondary/30 py-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                  ${activeTab === tab.id
                    ? "bg-accent text-foreground border-l-2 border-l-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === "appearance" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Color Theme</h3>
                  <p className="text-xs text-muted-foreground mb-3">Select the color theme for the editor and UI</p>
                  <div className="grid grid-cols-2 gap-2">
                    {themes.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setTheme(theme.name)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                          ${currentTheme === theme.name
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                          }`}
                      >
                        <div className="flex gap-0.5 flex-shrink-0">
                          {["--background", "--primary", "--accent", "--destructive"].map((key) => (
                            <div
                              key={key}
                              className="w-3 h-3 rounded-sm"
                              style={{ background: `hsl(${theme.colors[key]})` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium truncate">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "editor" && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Font Size</h3>
                  <p className="text-xs text-muted-foreground mb-2">Controls the font size in pixels</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10}
                      max={24}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-code text-foreground w-8 text-right">{fontSize}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Minimap</h3>
                    <p className="text-xs text-muted-foreground">Show minimap on the right side of the editor</p>
                  </div>
                  <button
                    onClick={() => setMinimap(!minimap)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${minimap ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${minimap ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Word Wrap</h3>
                    <p className="text-xs text-muted-foreground">Controls how lines should wrap</p>
                  </div>
                  <button
                    onClick={() => setWordWrap(!wordWrap)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${wordWrap ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${wordWrap ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              </>
            )}

            {activeTab === "terminal" && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Terminal</h3>
                <p className="text-xs text-muted-foreground mb-3">Terminal settings are applied automatically based on the selected theme.</p>
                <div className="rounded-lg border border-border bg-background p-3 font-code text-xs">
                  <div className="text-primary">user@cloudide</div>
                  <div className="text-muted-foreground">~/workspace $ echo "Terminal preview"</div>
                  <div className="text-foreground">Terminal preview</div>
                </div>
              </div>
            )}

            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Auto Save</h3>
                  <p className="text-xs text-muted-foreground">Files are auto-saved after a short delay</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Tab Size</h3>
                  <p className="text-xs text-muted-foreground">Default tab size: 2 spaces</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Version</h3>
                  <p className="text-xs text-muted-foreground">CloudIDE v1.0.0</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
