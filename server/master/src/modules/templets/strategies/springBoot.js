import fs from "fs/promises";
import path from "node:path";
import { run } from "./_base.js";

export const springBootStrategy = {
    devPort: 8080,
    devCmd:  "mvn spring-boot:run",
    scaffold: async (projectId, projectPath, projectName) => {
        const folder      = projectName || "sandbox";
        const sandboxPath = path.join(projectPath, folder);
        const zipPath     = path.join(projectPath, "starter.zip");

        await fs.mkdir(sandboxPath, { recursive: true });

        // start.spring.io /starter.zip only accepts GET with query-string params.
        // -G  = send all --data-urlencode values as query params (not POST body)
        // -f  = fail with exit code on HTTP 4xx/5xx (prevents saving error HTML as zip)
        // -L  = follow redirects
        // --retry 3 = retry on transient network failures
        // bootVersion is intentionally omitted → API uses the current stable default
        await run(
            `curl -G -f -L --retry 3 \
  "https://start.spring.io/starter.zip" \
  --data-urlencode "type=maven-project" \
  --data-urlencode "language=java" \
  --data-urlencode "baseDir=${folder}" \
  --data-urlencode "groupId=com.example" \
  --data-urlencode "artifactId=${folder}" \
  --data-urlencode "name=${folder}" \
  --data-urlencode "packageName=com.example.demo" \
  --data-urlencode "packaging=jar" \
  --data-urlencode "javaVersion=17" \
  --data-urlencode "dependencies=web" \
  -o starter.zip`,
            projectPath,
        );

        await run(`unzip -q starter.zip -d .`, projectPath);
        await run(`rm -f starter.zip`, projectPath);
    },
};