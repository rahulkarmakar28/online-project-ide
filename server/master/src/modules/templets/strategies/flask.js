import fs from "fs/promises";
import path from "node:path";

export const flaskStrategy = {
    devPort: 5000,
    devCmd:  "pip install -r requirements.txt && flask run --host=0.0.0.0 --port=5000",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        await fs.mkdir(sandboxPath, { recursive: true });

        await fs.writeFile(
            path.join(sandboxPath, "app.py"),
            `from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return jsonify(message="Hello World")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
`,
        );

        await fs.writeFile(
            path.join(sandboxPath, "requirements.txt"),
            `flask\n`,
        );
    },
};
