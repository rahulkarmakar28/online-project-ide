import fs from "fs/promises";
import path from "node:path";

export const goStrategy = {
    devPort: 8080,
    devCmd:  "go run main.go",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder      = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "main.go"),
`package main

import (
\t"fmt"
\t"net/http"
\t"os"
)

func main() {
\thttp.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
\t\tfmt.Fprintln(w, "Hello, World!")
\t})

\t// Change PORT to run on any port — the container exposes it automatically
\tport := os.Getenv("PORT")
\tif port == "" {
\t\tport = "8080"
\t}
\tfmt.Println("Server running on :" + port)
\thttp.ListenAndServe("0.0.0.0:" + port, nil)
}
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "go.mod"),
`module sandbox\n\ngo 1.22\n`,
        );
    },
};