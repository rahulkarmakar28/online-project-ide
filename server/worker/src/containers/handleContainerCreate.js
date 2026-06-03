import Docker from "dockerode";
import path   from "node:path";
import fs     from "node:fs";
import os     from "node:os";

import { TEMPLATE_IMAGE, TEMPLATE_PORTS } from "../utils/constant.js";

// PROJECTS_DIR — path as seen by THIS (worker) container — used for fs operations
export const PROJECTS_DIR = path.resolve(
    process.env.PROJECTS_DIR || path.join(process.cwd(), "../projects")
);

// HOST_PROJECTS_DIR — path as seen by the HOST machine — used for Docker bind mounts.
// Docker bind mounts always reference the HOST filesystem, not container paths.
// When running in Docker Compose with ./projects:/app/projects, the host path is
// the absolute path of ./projects on the host machine.
// Set HOST_PROJECTS_DIR in docker-compose to the host-side absolute path.
const HOST_PROJECTS_DIR = path.resolve(
    process.env.HOST_PROJECTS_DIR || PROJECTS_DIR
);

const getDockerClient = () => {
    const host = (process.env.DOCKER_HOST || "").trim();
    if (host.startsWith("tcp://") || host.startsWith("http://")) {
        const url = new URL(host.replace("tcp://", "http://"));
        return new Docker({ host: url.hostname, port: parseInt(url.port) || 2375, protocol: "http" });
    }
    if (host) {
        const socketPath = host.replace("unix://", "").replace("npipe://", "");
        console.log(`[docker] Socket from DOCKER_HOST: ${socketPath}`);
        return new Docker({ socketPath });
    }
    if (os.platform() === "win32") return new Docker({ socketPath: "//./pipe/docker_engine" });
    const uid = process.getuid?.() ?? 0;
    const xdg = process.env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
    const candidates = ["/var/run/docker.sock", `${xdg}/docker.sock`, `${xdg}/podman/podman.sock`, "/run/podman/podman.sock"];
    for (const s of candidates) {
        if (fs.existsSync(s)) { console.log(`[docker] Auto-detected: ${s}`); return new Docker({ socketPath: s }); }
    }
    return new Docker({ socketPath: "/var/run/docker.sock" });
};

const docker = getDockerClient();

docker.ping()
    .then(() => console.log("[docker] ✓ Connected"))
    .catch((err) => {
        console.error("[docker] ✗ Cannot connect:", err.message);
        console.error(`[docker]   DOCKER_HOST=${process.env.DOCKER_HOST || "(not set)"}`);
        console.error(`[docker]   PROJECTS_DIR=${PROJECTS_DIR}`);
        console.error(`[docker]   HOST_PROJECTS_DIR=${HOST_PROJECTS_DIR}`);
    });

const containerRegistry = new Map();
export const getContainerPort = (projectId) => containerRegistry.get(projectId)?.port ?? null;

export const handleContainerCreate = async (projectId, template, projectName) => {
    try {
        const internalPort = TEMPLATE_PORTS[template];
        const image        = TEMPLATE_IMAGE[template];

        console.log("[container] ─────────────────────────────");
        console.log(`[container] projectId=${projectId} template=${template}`);
        console.log(`[container] image=${image ?? "NOT FOUND"} port=${internalPort ?? "NOT FOUND"}`);
        console.log(`[container] PROJECTS_DIR=${PROJECTS_DIR}`);
        console.log(`[container] HOST_PROJECTS_DIR=${HOST_PROJECTS_DIR}`);

        if (!image) {
            console.error(`[container] ✗ No image for "${template}". Valid: ${Object.keys(TEMPLATE_IMAGE).join(", ")}`);
            return null;
        }
        if (!internalPort) {
            console.error(`[container] ✗ No port for "${template}"`);
            return null;
        }

        try {
            await docker.getImage(image).inspect();
            console.log(`[container] ✓ Image "${image}" found`);
        } catch {
            console.error(`[container] ✗ Image "${image}" NOT found. Run: bash build-images.sh`);
            return null;
        }

        // Reuse existing
        const all      = await docker.listContainers({ all: true });
        const existing = all.find((c) => c.Names.some((n) => n === `/project-${projectId}`));
        if (existing) {
            const container = docker.getContainer(existing.Id);
            const info      = await container.inspect();
            if (!info.State.Running) await container.start();
            const fresh    = await container.inspect();
            const hostPort = fresh.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;
            containerRegistry.set(projectId, { port: hostPort, template });
            console.log(`[container] ✓ Reused → localhost:${hostPort}`);
            return container;
        }

        // Create project directory on worker filesystem
        const projectPath = path.join(PROJECTS_DIR, projectId);
        fs.mkdirSync(projectPath, { recursive: true });
        try { fs.chmodSync(projectPath, 0o777); } catch {}

        // HOST_PROJECTS_DIR/{projectId} on host → /workspace in sandbox container
        const hostProjectPath = path.join(HOST_PROJECTS_DIR, projectId);
        const bindMount       = `${hostProjectPath}:/workspace:z`;

        console.log(`[container] Bind: ${bindMount}`);
        console.log(`[container] WorkingDir: /workspace/${projectName}`);

        const container = await docker.createContainer({
            Image:        image,
            name:         `project-${projectId}`,
            Tty:          true,
            OpenStdin:    true,
            AttachStdin:  true,
            AttachStdout: true,
            AttachStderr: true,
            Env:          ["HOST=0.0.0.0", "HOST_UID=1000", "HOST_GID=1000"],
            ExposedPorts: { [`${internalPort}/tcp`]: {} },
            HostConfig: {
                AutoRemove:   false,
                PortBindings: { [`${internalPort}/tcp`]: [{ HostIp: "0.0.0.0", HostPort: "" }] },
                Binds:        [bindMount],
            },
            WorkingDir: `/workspace/${projectName}`,
        });

        await container.start();

        try {
            const exec = await container.exec({
                Cmd: ["bash", "-c", "chown -R 1000:1000 /workspace && chmod -R u+rwX /workspace"],
                AttachStdout: true, AttachStderr: true,
            });
            await exec.start({});
        } catch (e) {
            console.warn("[container] chown warning:", e.message);
        }

        const info     = await container.inspect();
        const hostPort = info.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;
        containerRegistry.set(projectId, { port: hostPort, template });
        console.log(`[container] ✓ Ready → localhost:${hostPort} (container:${internalPort})`);
        return container;

    } catch (err) {
        console.error("[container] ✗ Fatal:", err.message);
        if (err.json) console.error("[container]   Docker API:", JSON.stringify(err.json));
        return null;
    }
};