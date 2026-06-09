import Docker from "dockerode";
import path   from "node:path";
import fs     from "node:fs";
import os     from "node:os";

import { TEMPLATE_IMAGE, TEMPLATE_PORTS } from "../utils/constant.js";
import { setContainerPort } from "../registry/containerRegistry.js";

export const PROJECTS_DIR = path.resolve(
    process.env.PROJECTS_DIR || path.join(process.cwd(), "../projects")
);

const HOST_PROJECTS_DIR = process.env.HOST_PROJECTS_DIR
    ? path.resolve(process.env.HOST_PROJECTS_DIR)
    : PROJECTS_DIR;

const getDockerClient = () => {
    const host = (process.env.DOCKER_HOST || "").trim();
    if (host.startsWith("tcp://") || host.startsWith("http://")) {
        const url = new URL(host.replace("tcp://", "http://"));
        return new Docker({ host: url.hostname, port: parseInt(url.port) || 2375, protocol: "http" });
    }
    if (host) return new Docker({ socketPath: host.replace("unix://","").replace("npipe://","") });
    if (os.platform() === "win32") return new Docker({ socketPath: "//./pipe/docker_engine" });
    const uid = process.getuid?.() ?? 0;
    const xdg = process.env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
    for (const s of ["/var/run/docker.sock", `${xdg}/docker.sock`, `${xdg}/podman/podman.sock`]) {
        if (fs.existsSync(s)) { console.log(`[docker] Socket: ${s}`); return new Docker({ socketPath: s }); }
    }
    return new Docker({ socketPath: "/var/run/docker.sock" });
};

const docker = getDockerClient();
docker.ping()
    .then(() => console.log("[docker] ✓ Connected"))
    .catch((err) => console.error("[docker] ✗ Cannot connect:", err.message));

export const handleContainerCreate = async (projectId, template, projectName) => {
    try {
        const internalPort = TEMPLATE_PORTS[template];
        const image        = TEMPLATE_IMAGE[template];

        if (!image)        { console.error(`[container] ✗ No image for "${template}"`); return null; }
        if (!internalPort) { console.error(`[container] ✗ No port for "${template}"`);  return null; }

        try { await docker.getImage(image).inspect(); }
        catch { console.error(`[container] ✗ Image "${image}" not found. Run build-images.sh`); return null; }

        // Reuse existing container
        const all      = await docker.listContainers({ all: true });
        const existing = all.find((c) => c.Names.some((n) => n === `/project-${projectId}`));
        if (existing) {
            const container = docker.getContainer(existing.Id);
            const info      = await container.inspect();
            if (!info.State.Running) await container.start();
            const fresh    = await container.inspect();
            const hostPort = fresh.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;
            // Store in Redis so any worker replica can find it
            await setContainerPort(projectId, hostPort, template);
            console.log(`[container] ✓ Reused → localhost:${hostPort}`);
            return container;
        }

        // Ensure project dir exists
        const projectPath = path.join(PROJECTS_DIR, projectId);
        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });
        try { fs.chmodSync(projectPath, 0o777); } catch {}

        const hostProjectPath = path.join(HOST_PROJECTS_DIR, projectId);
        const bindMount       = `${hostProjectPath}:/workspace:z`;

        console.log(`[container] Creating: image=${image} bind=${bindMount} workdir=/workspace/${projectName}`);

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
        } catch (e) { console.warn("[container] chown warning:", e.message); }

        const info     = await container.inspect();
        const hostPort = info.NetworkSettings.Ports[`${internalPort}/tcp`]?.[0]?.HostPort;

        // Store in Redis — shared across all worker replicas
        await setContainerPort(projectId, hostPort, template);
        console.log(`[container] ✓ Ready → localhost:${hostPort} (internal:${internalPort})`);
        return container;

    } catch (err) {
        console.error("[container] ✗ Fatal:", err.message);
        if (err.json) console.error("[container]   Docker API:", JSON.stringify(err.json));
        return null;
    }
};