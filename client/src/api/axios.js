import axios from "axios";

const api = axios.create({
    // Default to a same-origin "/api" so the app keeps working without a
    // build-time env var and the refresh cookie stays first-party. Override
    // with VITE_BASE_URL only in deployments that call the API cross-origin.
    baseURL: (import.meta.env.VITE_BASE_URL || "") + "/api",
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
                // Keep AuthContext in sync so role/photo/tokenVersion changes
                // from the refresh response are reflected without a reload.
                window.dispatchEvent(new CustomEvent("auth:refreshed", { detail: { token: data.token, user: data.user } }));
                return api(config);
            } catch {
                refreshing = null;
                localStorage.removeItem("token");
                // The live in-memory session must die too, or every subsequent
                // call 401s and burns the refresh limiter with no redirect.
                window.dispatchEvent(new CustomEvent("auth:expired"));
            }
        }
        return Promise.reject(error);
    }
);

export default api;