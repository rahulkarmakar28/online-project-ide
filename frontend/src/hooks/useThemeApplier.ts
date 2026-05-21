import { useEffect } from "react";
import { useThemeStore, themes } from "@/store/themeStore";

export const useThemeApplier = () => {
  const { currentTheme } = useThemeStore();

  useEffect(() => {
    const theme = themes.find((t) => t.name === currentTheme);
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [currentTheme]);
};
