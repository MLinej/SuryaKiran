import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('suryakiran_user');
        const token = localStorage.getItem('suryakiran_token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('suryakiran_user', JSON.stringify(userData));
        localStorage.setItem('suryakiran_token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('suryakiran_user');
        localStorage.removeItem('suryakiran_token');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
