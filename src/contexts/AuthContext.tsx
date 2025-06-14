import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, logout as logoutService, isAuthenticated as checkAuth, LoginData } from '../services/authService';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(checkAuth());
    }, []);

    const login = async (email: string, password: string) => {
        const loginData: LoginData = { email, password };
        await loginService(loginData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        logoutService();
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 