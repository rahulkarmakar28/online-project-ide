import fs from "fs/promises";
import path from "node:path";

export const javaStrategy = {
    devPort: null,
    devCmd:  "javac Main.java && java Main",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "Main.java"),
            `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, ".setup.sh"),
            `#!/bin/bash
which java || (apt-get update -qq && apt-get install -y default-jdk)
echo "Java ready: $(java -version 2>&1 | head -1)"
`,
        );
    },
};
