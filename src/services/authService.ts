import api from './api';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export const login = async (data: LoginData) => {
    try {
        const response = await api.post('/users/login', data);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const register = async (data: RegisterData) => {
    try {
        console.log('Sending register request:', data);
        const response = await api.post('/users/register', data);
        console.log('Register response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
}; 