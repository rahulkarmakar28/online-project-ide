/**
 * containerRegistry.js
 *
 * Replaces the in-process Map() with Redis.
 *
 * WHY REDIS:
 * - When running multiple worker replicas (horizontal scaling), each process
 *   has its own Map so one worker can't see containers started by another.
 * - Redis is shared across all worker replicas — any worker can look up
 *   which host port a container is bound to.
 * - TTL keys replace the manual setTimeout cleanup timers.
 *   Redis automatically expires keys — no timer leak if a worker crashes.
 *
 * KEY SCHEMA:
 *   container:{projectId}:port    → host port string          (no TTL — lives as long as container)
 *   container:{projectId}:template→ template string           (no TTL)
 *   container:{projectId}:conns   → active WS connection count (no TTL)
 *   container:{projectId}:cleanup → "1"                        (TTL = cleanup delay in seconds)
 *                                   Existence of this key means a cleanup is scheduled.
 *                                   Expiry fires the cleanup via keyspace notifications.
 */

import redis from "../config/redisConfig.js";
import Docker from "dockerode";
import fs from "node:fs";
import os from "node:os";

// ── Docker client (same as handleContainerCreate) ─────────────────────────────
const getDocker = () => {
    const host = (process.env.DOCKER_HOST || "").trim();
    if (host) return new Docker({ socketPath: host.replace("unix://", "").replace("npipe://", "") });
    if (os.platform() === "win32") return new Docker({ socketPath: "//./pipe/docker_engine" });
    const uid = process.getuid?.() ?? 0;
    const xdg = process.env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
    for (const s of ["/var/run/docker.sock", `${xdg}/docker.sock`, `${xdg}/podman/podman.sock`]) {
        if (fs.existsSync(s)) return new Docker({ socketPath: s });
    }
    return new Docker({ socketPath: "/var/run/docker.sock" });
};
const docker = getDocker();

// ── Key helpers ───────────────────────────────────────────────────────────────
const portKey     = (id) => `container:${id}:port`;
const templateKey = (id) => `container:${id}:template`;
const connsKey    = (id) => `container:${id}:conns`;
const cleanupKey  = (id) => `container:${id}:cleanup`;

// ── Port registry ─────────────────────────────────────────────────────────────
export const setContainerPort = async (projectId, port, template) => {
    await redis.set(portKey(projectId),     String(port));
    await redis.set(templateKey(projectId), template);
};

export const getContainerPort = async (projectId) => {
    const val = await redis.get(portKey(projectId));
    return val ? parseInt(val, 10) : null;
};

// export const deleteContainerRecord = async (projectId) => {
//     await redis.del(portKey(projectId), templateKey(projectId), connsKey(projectId), cleanupKey(projectId));
// };

// ── Connection count ──────────────────────────────────────────────────────────
export const incrementConnections = async (projectId) => {
    return redis.incr(connsKey(projectId));
};

export const decrementConnections = async (projectId) => {
    const val = await redis.decr(connsKey(projectId));
    return Math.max(0, val);
};

export const getConnectionCount = async (projectId) => {
    const val = await redis.get(connsKey(projectId));
    return parseInt(val ?? "0", 10);
};

// ── Cleanup scheduling via Redis TTL ─────────────────────────────────────────
// Instead of setTimeout (which is lost on process restart/crash), we use
// a Redis key with a TTL. A background poller checks for expired cleanup keys.
export const scheduleCleanup = async (projectId, delaySeconds = 120) => {
    await redis.set(cleanupKey(projectId), "1", { EX: delaySeconds });
    console.log(`[cleanup] Scheduled in ${delaySeconds}s for ${projectId}`);
};

export const cancelCleanup = async (projectId) => {
    const deleted = await redis.del(cleanupKey(projectId));
    if (deleted) console.log(`[cleanup] Cancelled for ${projectId}`);
};

export const isCleanupScheduled = async (projectId) => {
    return (await redis.exists(cleanupKey(projectId))) === 1;
};

// ── Container removal ─────────────────────────────────────────────────────────
export const stopContainer = async (projectId) => {
    try {
        const containers = await docker.listContainers({ all: false });
        const found      = containers.find((c) =>
            c.Names.some((n) => n === `/project-${projectId}`),
        );
        if (!found) { console.log(`[cleanup] Already gone: ${projectId}`); return; }
        const container = docker.getContainer(found.Id);
        await container.stop({ t: 3 });
        await container.remove({ force: true });
        await deleteContainerRecord(projectId);
        console.log(`[cleanup] ✓ Removed: ${projectId}`);
    } catch (err) {
        if (!err.message?.includes("no such container") && !err.message?.includes("404")) {
            console.error("[cleanup] Error:", err.message);
        }
    }
};

// ── Background poller ─────────────────────────────────────────────────────────
// Polls Redis every 15s for expired cleanup keys whose containers should be removed.
// This is resilient to worker restarts — if a worker crashes mid-cleanup-timer,
// the next worker to start picks it up within 15s.
//
// Alternative: enable Redis keyspace notifications and use SUBSCRIBE
// ("notify-keyspace-events Ex") — but that requires Redis server config changes.
// Polling is simpler and works out of the box.
export const startCleanupPoller = () => {
    const POLL_INTERVAL = 15_000; // 15 seconds

    const poll = async () => {
        try {
            // Scan for all cleanup keys
            let cursor = 0;
            do {
                const result = await redis.scan(cursor, {
                    MATCH: "container:*:cleanup",
                    COUNT: 100,
                });
                cursor = result.cursor;

                for (const key of result.keys) {
                    // Check TTL — if key expired or TTL is 0, it's time to clean up
                    const ttl = await redis.ttl(key);
                    if (ttl <= 0) {
                        const projectId = key.split(":")[1];
                        const conns     = await getConnectionCount(projectId);
                        if (conns <= 0) {
                            console.log(`[cleanup] Poller firing for ${projectId}`);
                            await stopContainer(projectId);
                        } else {
                            // Someone reconnected — cancel cleanup
                            await cancelCleanup(projectId);
                        }
                    }
                }
            } while (cursor !== 0);
        } catch (err) {
            console.error("[cleanup] Poller error:", err.message);
        }
    };

    setInterval(poll, POLL_INTERVAL);
    console.log(`[cleanup] Poller started (interval: ${POLL_INTERVAL / 1000}s)`);
};
// ── Watcher ref counting (for editorServer chokidar instances) ────────────────
const watcherKey = (id) => `container:${id}:watchers`;

export const incrementWatcherRefs = async (projectId) => {
    return redis.incr(watcherKey(projectId));
};

export const decrementWatcherRefs = async (projectId) => {
    const val = await redis.decr(watcherKey(projectId));
    const clamped = Math.max(0, val);
    // Clean up the key if it hits zero — avoids stale counter on reconnect
    if (clamped === 0) await redis.del(watcherKey(projectId));
    return clamped;
};

export const getWatcherRefs = async (projectId) => {
    const val = await redis.get(watcherKey(projectId));
    return parseInt(val ?? "0", 10);
};
// In deleteContainerRecord — add watcherKey to the del call:
export const deleteContainerRecord = async (projectId) => {
    await redis.del(
        portKey(projectId),
        templateKey(projectId),
        connsKey(projectId),
        cleanupKey(projectId),
        watcherKey(projectId),   // ← add this
    );
};