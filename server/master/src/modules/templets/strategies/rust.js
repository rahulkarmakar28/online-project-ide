import fs from "fs/promises";
import path from "node:path";

export const rustStrategy = {
    devPort: null,
    devCmd:  "cargo run",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        const srcPath = path.join(sandboxPath, "src");
        await fs.mkdir(srcPath, { recursive: true });

        await fs.writeFile(
            path.join(srcPath, "main.rs"),
            `fn main() {
    println!("Hello, world!");
}
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "Cargo.toml"),
            `[package]
name = "sandbox"
version = "0.1.0"
edition = "2021"

[dependencies]
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, ".setup.sh"),
            `#!/bin/bash
which cargo || (curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path)
export PATH="$HOME/.cargo/bin:$PATH"
echo "Rust ready: $(rustc --version)"
`,
        );
    },
};
