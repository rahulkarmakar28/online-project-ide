import fs from "fs/promises";
import path from "node:path";

export const fastapiStrategy = {
    devPort: 8000,
    devCmd:  "pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "main.py"),
            `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "requirements.txt"),
            `fastapi
uvicorn[standard]
`,
        );
    },
};
