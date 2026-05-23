import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const axiosInstance = axios.create({ baseURL: BASE_URL, withCredentials: true });

// ── Attach access token on every request ────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Auto-refresh on 401 ──────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

const flushQueue = (error: unknown, token: string | null = null) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token!);
    });
    pendingQueue = [];
};

axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalReq = error.config;

        if (
            error.response?.status === 401 &&
            !originalReq._retry &&
            !originalReq.url?.includes("/auth/refresh")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (token) => {
                            originalReq.headers.Authorization = `Bearer ${token}`;
                            resolve(axiosInstance(originalReq));
                        },
                        reject,
                    });
                });
            }

            originalReq._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axiosInstance.post(
                    `/api/v1/auth/refresh`,
                    {},
                    { withCredentials: true },
                );
                const newToken: string = data.data.token;
                localStorage.setItem("token", newToken);
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                flushQueue(null, newToken);
                originalReq.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalReq);
            } catch (refreshErr) {
                flushQueue(refreshErr, null);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;