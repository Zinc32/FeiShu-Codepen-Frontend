import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, logout as logoutService, isAuthenticated as checkAuth, getCurrentUser, LoginData, User } from '../services/authService';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const authenticated = checkAuth();
        setIsAuthenticated(authenticated);

        if (authenticated) {
            const currentUser = getCurrentUser();
            setUser(currentUser);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const loginData: LoginData = { email, password };
        const result = await loginService(loginData);
        setIsAuthenticated(true);
        setUser(result.user);
    };

    const logout = async () => {
        await logoutService();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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