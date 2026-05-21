import Docker from "dockerode";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { TEMPLATE_IMAGE, TEMPLATE_PORTS } from "../utils/constant.js";

export const PROJECTS_DIR = path.resolve(process.cwd(), "../projects");

// ── Detect Docker socket — works on Fedora/Ubuntu/Mac/Windows ────────────────
const getDockerClient = () => {
    // 1. Explicit DOCKER_HOST env override
    const dockerHost = process.env.DOCKER_HOST;
    if (dockerHost) {
        if (dockerHost.startsWith("tcp://") || dockerHost.startsWith("http://")) {
            const url = new URL(dockerHost.replace("tcp://", "http://"));
            return new Docker({
                host:     url.hostname,
                port:     parseInt(url.port) || 2375,
                protocol: "http",
            });
        }
        // unix:// or npipe://
        return new Docker({
            socketPath: dockerHost.replace(/^(unix|npipe):\/\//, ""),
        });
    }

    // 2. Windows named pipe
    if (os.platform() === "win32") {
        return new Docker({ socketPath: "//./pipe/docker_engine" });
    }

    // 3. Try sockets in order of likelihood
    const uid = process.getuid?.() ?? 1000;
    const xdg = process.env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
    const candidates = [
        "/var/run/docker.sock",           // standard Docker on Linux (Fedora, Ubuntu…)
        `${xdg}/docker.sock`,             // Docker rootless
        `${xdg}/podman/podman.sock`,      // Podman rootless
        "/run/podman/podman.sock",         // Podman root
    ];

    for (const s of candidates) {
        if (fs.existsSync(s)) {
            console.log(`[docker] Using socket: ${s}`);
            return new Docker({ socketPath: s });
        }
    }

    // 4. Fallback
    console.warn("[docker] No socket found, falling back to /var/run/docker.sock");
    return new Docker({ socketPath: "/var/run/docker.sock" });
};

const docker = getDockerClient();

// projectId → { port, template }
const containerRegistry = new Map();

export const getContainerPort = (projectId) =>
    containerRegistry.get(projectId)?.port ?? null;

export const handleContainerCreate = async (projectId, template, projectName) => {
    try {
        // FIX: use TEMPLATE_PORTS (correct keys like "react-js", "nodejs", "go")
        // not DEFAULT_PORTS (which had wrong keys like "react", "golang")
        const internalPort = TEMPLATE_PORTS[template] || 3000;
        const image        = TEMPLATE_IMAGE[template];

        if (!image) {
            console.error(`[container] No image mapped for template: ${template}`);
            return null;
        }

        console.log(`[container] Creating for projectId=${projectId} template=${template} image=${image} port=${internalPort}`);

        // ── Reuse existing container ──────────────────────────────────────
        const all      = await docker.listContainers({ all: true });
        const existing = all.find((c) =>
            c.Names.some((n) => n === `/project-${projectId}`),
        );

        if (existing) {
            const container = docker.getContainer(existing.Id);
            const info      = await container.inspect();

            if (!info.State.Running) {
                console.log(`[container] Restarting stopped container ${projectId}`);
                await container.start();
            }

            // Re-inspect to get up-to-date port bindings
            const fresh    = await container.inspect();
            const hostPort = fresh.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;
            containerRegistry.set(projectId, { port: hostPort, template });
            console.log(`[container] Reused ${projectId} → localhost:${hostPort}`);
            return container;
        }

        // ── Create new container ──────────────────────────────────────────
        const projectPath     = path.join(PROJECTS_DIR, projectId);
        const fullProjectPath = path.join(projectPath, projectName);
        fs.mkdirSync(fullProjectPath, { recursive: true });

        // Bind mount flag:
        //   :z  — shared SELinux relabelling (works on Fedora with Docker or Podman)
        //   :Z  — private SELinux relabelling (Podman only — breaks with Docker)
        // Using :z is safe for both.
        const bindMount = `${projectPath}:/workspace:z`;

        const container = await docker.createContainer({
            Image:        image,
            name:         `project-${projectId}`,
            Tty:          true,
            OpenStdin:    true,
            AttachStdin:  true,
            AttachStdout: true,
            AttachStderr: true,
            Env: [
                "HOST=0.0.0.0",
                `HOST_UID=${process.getuid?.() ?? 1000}`,
                `HOST_GID=${process.getgid?.() ?? 1000}`,
            ],
            ExposedPorts: {
                [`${internalPort}/tcp`]: {},
            },
            HostConfig: {
                AutoRemove: false,
                PortBindings: {
                    [`${internalPort}/tcp`]: [{ HostIp: "0.0.0.0", HostPort: "" }],
                },
                Binds: [bindMount],
            },
            WorkingDir: `/workspace/${projectName}`,
        });

        await container.start();

        // Fix workspace ownership so sandbox user can write files
        const exec = await container.exec({
            Cmd:          ["chown", "-R", "sandbox:sandbox", "/workspace"],
            AttachStdout: true,
            AttachStderr: true,
        });
        await exec.start({});

        const info     = await container.inspect();
        const hostPort = info.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;

        containerRegistry.set(projectId, { port: hostPort, template });
        console.log(`[container] Started ${projectId} → localhost:${hostPort} (internal:${internalPort})`);

        return container;

    } catch (err) {
        console.error("[container error]", err.message);
        console.error("[container error full]", err);
        return null;
    }
};