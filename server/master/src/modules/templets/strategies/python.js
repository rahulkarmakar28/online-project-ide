import fs from "fs/promises";
import path from "node:path";
import { run } from "./_base.js";

export const pythonStrategy = {
    devPort: null,
    devCmd:  "python3 main.py",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        // install python3 inside the container's project folder is a host-side op;
        // we just prepare the files here — runtime install happens in the container
        // via the container setup script (see worker/src/containers/handleContainerCreate.js)
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "main.py"),
            `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "requirements.txt"),
            `# add your dependencies here\n`,
        );
    },
};
