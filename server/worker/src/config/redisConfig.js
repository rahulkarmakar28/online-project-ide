import { createClient } from "redis";
import { REDIS_URL } from "../config/serverConfig.js";  // .js extension required in ESM

const redis = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error("[redis] Too many reconnect attempts — giving up");
                return new Error("Redis unavailable");
            }
            const delay = Math.min(retries * 200, 3000);
            console.warn(`[redis] Reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
        },
    },
});

redis.on("error",        (err) => console.error("[redis] Error:", err.message));
redis.on("connect",      ()    => console.log(`[redis] Connected to ${REDIS_URL}`));
redis.on("reconnecting", ()    => console.warn("[redis] Reconnecting…"));

await redis.connect();

export default redis;