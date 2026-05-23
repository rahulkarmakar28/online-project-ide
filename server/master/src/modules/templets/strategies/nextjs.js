import { run, patchPackageJson } from "./_base.js";

export const nextjsStrategy = {
  devPort: 3000,
  devCmd: "npm run dev",

  scaffold: async (projectId, projectPath, projectName) => {
    const folder = projectName || "sandbox";

    await run(
      `npx create-next-app@latest ${folder} --ts --tailwind --eslint --app --no-src-dir --no-import-alias`,
      projectPath
    );

    await run(`chmod -R 777 "${projectPath}/${folder}"`);


    await patchPackageJson(`${projectPath}/${folder}`, {
      dev: "npx next dev -H 0.0.0.0",
    });
  },
};