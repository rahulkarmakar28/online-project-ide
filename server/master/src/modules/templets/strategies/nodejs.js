import fs from "fs/promises";
import path from "node:path";
import { run } from "./_base.js";

export const nodejsStrategy = {
    devPort: 3000,
    devCmd:  "node index.js",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await run(`npm init -y`, sandboxPath);
        await run(`npm install express`, sandboxPath);

        await fs.writeFile(
            path.join(sandboxPath, "index.js"),
            `import express from "express";

const app = express();

// Change PORT to any port you want — the container will expose it automatically.
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});
`,
        );

        // update package.json to use ESM + add start/dev scripts
        const pkgPath = path.join(sandboxPath, "package.json");
        const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
        pkg.type = "module";
        pkg.scripts = { start: "node index.js", dev: "node --watch index.js" };
        await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
    },
};