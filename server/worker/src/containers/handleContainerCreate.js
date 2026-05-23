import Docker from "dockerode";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { TEMPLATE_IMAGE, TEMPLATE_PORTS } from "../utils/constant.js";

export const PROJECTS_DIR = path.resolve(process.cwd(), "../projects");

const getDockerClient = () => {
    if (process.env.DOCKER_HOST) {
        const h = process.env.DOCKER_HOST;
        if (h.startsWith("tcp://") || h.startsWith("http://")) {
            const url = new URL(h.replace("tcp://", "http://"));
            return new Docker({ host: url.hostname, port: parseInt(url.port) || 2375, protocol: "http" });
        }
        return new Docker({ socketPath: h.replace(/^(unix|npipe):\/\//, "") });
    }
    if (os.platform() === "win32") {
        return new Docker({ socketPath: "//./pipe/docker_engine" });
    }
    const uid = process.getuid?.() ?? 1000;
    const xdg = process.env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
    const candidates = [
        "/var/run/docker.sock",
        `${xdg}/docker.sock`,
        `${xdg}/podman/podman.sock`,
        "/run/podman/podman.sock",
    ];
    for (const s of candidates) {
        if (fs.existsSync(s)) { console.log(`[docker] socket: ${s}`); return new Docker({ socketPath: s }); }
    }
    return new Docker({ socketPath: "/var/run/docker.sock" });
};

const docker = getDockerClient();
const containerRegistry = new Map();

export const getContainerPort = (projectId) => containerRegistry.get(projectId)?.port ?? null;

export const handleContainerCreate = async (projectId, template, projectName) => {
    try {
        const internalPort = TEMPLATE_PORTS[template] || 3000;
        const image        = TEMPLATE_IMAGE[template];
        if (!image) { console.error(`[container] No image for template: ${template}`); return null; }

        console.log(`[container] projectId=${projectId} template=${template} image=${image} port=${internalPort}`);

        const all      = await docker.listContainers({ all: true });
        const existing = all.find(c => c.Names.some(n => n === `/project-${projectId}`));

        if (existing) {
            const container = docker.getContainer(existing.Id);
            const info      = await container.inspect();
            if (!info.State.Running) await container.start();
            const fresh    = await container.inspect();
            const hostPort = fresh.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;
            containerRegistry.set(projectId, { port: hostPort, template });
            return container;
        }

        const projectPath     = path.join(PROJECTS_DIR, projectId);
        const fullProjectPath = path.join(projectPath, projectName);
        fs.mkdirSync(fullProjectPath, { recursive: true });

        // chmod 775 before mounting so vite can write .timestamp files
        try { fs.chmodSync(projectPath, 0o777); } catch {}

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
            ExposedPorts: { [`${internalPort}/tcp`]: {} },
            HostConfig: {
                AutoRemove: false,
                PortBindings: { [`${internalPort}/tcp`]: [{ HostIp: "0.0.0.0", HostPort: "" }] },
                Binds: [`${projectPath}:/workspace:z`],
            },
            WorkingDir: `/workspace/${projectName}`,
        });

        await container.start();

        // chown inside container so sandbox user owns everything including
        // files created by Node scaffold running as the host user
        const exec = await container.exec({
            Cmd: ["bash", "-c", "chown -R sandbox:sandbox /workspace && chmod -R u+rwX /workspace"],
            AttachStdout: true,
            AttachStderr: true,
        });
        await exec.start({});

        const info     = await container.inspect();
        const hostPort = info.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;
        containerRegistry.set(projectId, { port: hostPort, template });

        console.log(`[container] started ${projectId} → localhost:${hostPort} (internal:${internalPort})`);
        return container;

    } catch (err) {
        console.error("[container error]", err.message);
        return null;
    }
};