import { run, patchPackageJson } from "./_base.js";

export const angularStrategy = {
    devPort: 4200,
    devCmd: "npm install && npx ng serve --host 0.0.0.0",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        await run(
            `npx @angular/cli@latest new ${folder} --routing --style=css --no-interactive`,
            projectPath,
        );
        await run(`chmod -R 777 "${projectPath}/${folder}"`);
        await patchPackageJson(`${projectPath}/${folder}`, {
            dev: "ng serve --host 0.0.0.0",
        });
    },
};
