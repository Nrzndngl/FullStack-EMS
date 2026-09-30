import axios from "axios";

const api = axios.create({
    baseURL: (import.meta.env.VITE_BASE_URL || "http://localhost:4000") + "/api",
    withCredentials: true,
});

// Attach access token to all network requests
api.interceptors.request.use((config) => {
    const raw = localStorage.getItem("token")
    if (raw && raw.length > 4096) {
        // Drop oversized tokens (legacy tokens that embedded a base64 photo).
        // Sending them exceeds edge request-header limits (HTTP 494) and
        // breaks every authenticated call; the refresh flow will mint a
        // valid small token from the refresh cookie.
        localStorage.removeItem("token")
    } else if (raw) {
        config.headers.Authorization = `Bearer ${raw}`
    }
    return config;
})

// Single-flight refresh when an access token expires (401).
// Falls back to clearing the stored token so AuthContext can recover.
let refreshing = null;

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const { config, response } = error;
        const skip = config?.url?.includes("/auth/login") || config?.url?.includes("/auth/refresh");
        if (response?.status === 401 && !config?._retry && !skip) {
            config._retry = true;
            try {
                refreshing = refreshing || api.post("/auth/refresh");
                const { data } = await refreshing;
                refreshing = null;
                localStorage.setItem("token", data.token);
                config.headers.Authorization = `Bearer ${data.token}`;
                return api(config);
            } catch {
                refreshing = null;
                localStorage.removeItem("token");
            }
        }
        return Promise.reject(error);
    }
);

export default api;