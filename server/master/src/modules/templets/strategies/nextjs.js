import { run, patchPackageJson } from "./_base.js";

export const nextjsStrategy = {
    devPort: 3000,
    devCmd:  "npm install && npm run dev",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        await run(
            `npx create-next-app@latest ${folder} --ts --tailwind --eslint --app --no-src-dir --no-import-alias`,
            projectPath,
        );
        await patchPackageJson(`${projectPath}/${folder}`, {
            dev: "next dev -H 0.0.0.0",
        });
    },
};
