import fs from "fs/promises";
import path from "node:path";
import { run } from "./_base.js";

export const htmlCssJsStrategy = {
    devPort: 5500,
    devCmd:  "npx live-server --host=0.0.0.0 --port=5500",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "index.html"),
            `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello World</h1>
  <script src="script.js"></script>
</body>
</html>
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "style.css"),
            `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; padding: 2rem; }
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "script.js"),
            `console.log("Hello from script.js");
`,
        );

        // Create package.json so `npm run dev` works like every other template
        await fs.writeFile(
            path.join(sandboxPath, "package.json"),
            JSON.stringify({
                name: folder,
                version: "1.0.0",
                scripts: {
                    dev: "live-server --port=5500 --host=0.0.0.0 --no-browser",
                },
                devDependencies: {
                    "live-server": "^1.2.2",
                },
            }, null, 2),
        );

        // Install live-server inside the project folder
        await run(`npm install`, sandboxPath);
    },
};
