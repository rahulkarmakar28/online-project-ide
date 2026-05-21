import { run } from "./_base.js";

export const honoStrategy = {
    devPort: 3000,
    devCmd:  "npm run dev",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        await run(
            `npm create hono@latest ${folder} -- --template nodejs --install --pm npm`,
            projectPath,
        );
        // Hono uses process.env.PORT — user can set any port they want
    },
};