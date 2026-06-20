import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';

const TOKEN_KEY = 'clubin_token';
const USER_KEY = 'clubin_user';

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

function readStored(): { token: string | null; user: AuthUser | null } {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const rawUser = localStorage.getItem(USER_KEY);
        return { token, user: rawUser ? (JSON.parse(rawUser) as AuthUser) : null };
    } catch {
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const stored = readStored();
        setToken(stored.token);
        setUser(stored.user);
    }, []);

    const login = (newToken: string, newUser: AuthUser) => {
        setToken(newToken);
        setUser(newUser);
        try {
            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        } catch { /* storage unavailable — keep in-memory */ }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } catch { /* ignore */ }
    };

    return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}
