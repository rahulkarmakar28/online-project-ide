import { run, patchPackageJson } from "./_base.js";

export const reactJsStrategy = {
    devPort: 5173,
    devCmd:  "npm run dev",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        await run(
            `npm create vite@latest ${folder} -- --template react`,
            projectPath,
        );
        await run(`npm install`, `${projectPath}/${folder}`);
        await patchPackageJson(`${projectPath}/${folder}`, {
            dev: "vite --host --port 5173",
        });
    },
};