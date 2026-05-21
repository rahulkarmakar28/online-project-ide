import { run, patchPackageJson } from "./_base.js";

export const vueStrategy = {
    devPort: 5173,
    devCmd:  "npm run dev",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        await run(
            `npm create vite@latest ${folder} -- --template vue`,
            projectPath,
        );
        await run(`npm install`, `${projectPath}/${folder}`);
        await patchPackageJson(`${projectPath}/${folder}`, {
            dev: "vite --host",
        });
    },
};