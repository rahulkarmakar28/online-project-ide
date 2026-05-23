import { run, patchPackageJson } from "./_base.js";

export const reactTsStrategy = {
    devPort: 5173,
    devCmd: "npm run dev",
    scaffold: async (projectId, projectPath, projectName) => {
    const folder = projectName || "sandbox";
        await run(
            `npm create vite@latest ${projectName} -- --template react-ts`,
            projectPath,
        );
        await run(`npm install`, `${projectPath}/${projectName}`);
        await run(`chmod -R 777 "${projectPath}/${folder}"`);
        await patchPackageJson(`${projectPath}/${projectName}`, {
            dev: "vite --host",
        });
    },
};
