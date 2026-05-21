import { create } from "zustand";
import { getExtension } from "../utils/editor";

export interface ActiveFileTab {
  path: string;
  value: string;
  name: string;
  extension: string;
}

interface ActiveFileTabStore {
  activeFileTab: ActiveFileTab | null;
  openTabs: ActiveFileTab[];
  setActiveFileTab: (path: string, value: string, name: string) => void;
  closeTab: (path: string) => void;
}

export const useActiveFileTabStore = create<ActiveFileTabStore>((set, get) => ({
  activeFileTab: null,
  openTabs: [],
  setActiveFileTab: (path, value, name) => {
    const ext = getExtension(name);
    const tab: ActiveFileTab = { path, value, name, extension: ext };
    const existing = get().openTabs.find((t) => t.path === path);
    set({
      activeFileTab: tab,
      openTabs: existing
        ? get().openTabs.map((t) => (t.path === path ? tab : t))
        : [...get().openTabs, tab],
    });
  },
  closeTab: (path) => {
    const tabs = get().openTabs.filter((t) => t.path !== path);
    const active = get().activeFileTab;
    set({
      openTabs: tabs,
      activeFileTab: active?.path === path ? (tabs[tabs.length - 1] ?? null) : active,
    });
  },
}));
