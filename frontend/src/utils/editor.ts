export const getLanguageFromExtension = (ext?: string): string => {
  const map: Record<string, string> = {
    js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript",
    py: "python", pyw: "python",
    java: "java", kt: "kotlin", scala: "scala",
    c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp",
    cs: "csharp",
    html: "html", htm: "html", css: "css", scss: "scss", less: "less",
    json: "json", yaml: "yaml", yml: "yaml", toml: "toml",
    md: "markdown", markdown: "markdown",
    sh: "shell", bash: "shell", zsh: "shell",
    go: "go", rs: "rust", rb: "ruby", php: "php", swift: "swift", dart: "dart",
    sql: "sql", xml: "xml", svg: "xml",
    dockerfile: "dockerfile", makefile: "makefile",
    txt: "plaintext",
  };
  return map[ext?.toLowerCase() ?? ""] || "plaintext";
};

export const getExtension = (name?: string): string => {
  if (!name || !name.includes(".")) return "";
  return name.split(".").pop() ?? "";
};
