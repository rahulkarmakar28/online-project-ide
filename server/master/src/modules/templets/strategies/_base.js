import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs/promises";
import path from "node:path";

export const execAsync = promisify(exec);

export const run = async (cmd, cwd) => {
    console.log(`[scaffold] ${cmd}  (cwd: ${cwd})`);
    const { stdout, stderr } = await execAsync(cmd, { cwd });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
};

export const writeFile = async (filePath, content) => {
    await fs.mkdir(filePath.split("/").slice(0, -1).join("/"), { recursive: true });
    await fs.writeFile(filePath, content);
};

export const patchPackageJson = async (projectDir, scripts) => {
    const pkgPath = path.join(projectDir, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    pkg.scripts = { ...pkg.scripts, ...scripts };
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
};

export const DEFAULT_PORTS = {
    "react-js":  5173,
    "vue":       5173,
    "next-js":   3000,
    "nodejs":    3000,
    "python":    8000,
    "django":    8000,
    "flask":     5000,
};