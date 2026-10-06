import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    const refreshSession = async () => {
        const storedToken = localStorage.getItem("token")
        setToken(storedToken)
        if (!storedToken) {
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/session")
            setUser(data.user)
            setToken(localStorage.getItem("token") || storedToken)
        } catch (err) {
            // Only treat auth failures as session death. A transient 500/429
            // or network blip must not force an innocent logout.
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                localStorage.removeItem("token")
                setUser(null)
                setToken(null)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshSession()
    }, [])

    // React to refresh lifecycle events emitted by the axios interceptor.
    useEffect(() => {
        const onExpired = () => {
            localStorage.removeItem("token")
            setUser(null)
            setToken(null)
        }
        const onRefreshed = (e) => {
            const { token: t, user: u } = e.detail || {}
            setToken(t || localStorage.getItem("token"))
            if (u) setUser(u)
        }
        window.addEventListener("auth:expired", onExpired)
        window.addEventListener("auth:refreshed", onRefreshed)
        return () => {
            window.removeEventListener("auth:expired", onExpired)
            window.removeEventListener("auth:refreshed", onRefreshed)
        }
    }, [])

    const login = async (email, password, role_type) => {
        const { data } = await api.post("/auth/login", {
            email, password, role_type
        })
        localStorage.setItem("token", data.token)
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }

    const logout = async () => {
        // Clear local auth state synchronously BEFORE the network call so a
        // navigation triggered at the same time never restores the session.
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        try {
            await api.post("/auth/logout")
        } catch {
            // Ignore network errors on logout; local state is already cleared.
        }
    }



    const value = { user, token, loading, login, logout, refreshSession }

    return <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>

}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("UseAuth must be used within AuthProvider");
    return ctx;

}