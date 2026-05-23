import { run } from "./_base.js";
import fs from "fs/promises";
import path from "node:path";

export const djangoStrategy = {
    devPort: 8000,

    devCmd:
        "pip install -r requirements.txt && python3 manage.py runserver 0.0.0.0:8000",

    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);

        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "requirements.txt"),
            `django\n`
        );

        // install django + create project
        await run(
            `
python3 -m pip install django &&
django-admin startproject app .
`,
            sandboxPath
        );
    },
};