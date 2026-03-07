import React, { createContext, useMemo, useState } from 'react';

export const AuthContext = createContext();

function safeParseUser() {
    try {
        const raw = localStorage.getItem('suryakiran_user');
        return raw ? JSON.parse(raw) : null;
    } catch (_error) {
        localStorage.removeItem('suryakiran_user');
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('suryakiran_token') || '');
    const [user, setUser] = useState(() => safeParseUser());
    const loading = false;

    const login = (userData, authToken) => {
        localStorage.setItem('suryakiran_token', authToken);
        localStorage.setItem('suryakiran_user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('suryakiran_token');
        localStorage.removeItem('suryakiran_user');
        setToken('');
        setUser(null);
    };

    const value = useMemo(() => ({
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(token),
    }), [token, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
