import axios from "axios";

const api = axios.create({
    baseURL: (import.meta.env.VITE_BASE_URL || "http://localhost:4000") + "/api",
    withCredentials: true,
});

// Attach access token to all network requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
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