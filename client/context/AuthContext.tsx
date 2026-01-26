import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/config';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'farmer' | 'buyer';
}

interface AuthContextProps {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    register: (userData: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    token: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    register: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        checkLogin();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/auth/login');
        } else if (user) {
            // Redirect based on role if at root or in auth group
            if (inAuthGroup || (segments as string[]).length === 0) {
                if (user.role === 'farmer') {
                    router.replace('/(farmer)/dashboard');
                } else {
                    router.replace('/(buyer)/home');
                }
            }
        }
    }, [user, isLoading, segments]);

    const checkLogin = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync('token');
            const userData = await SecureStore.getItemAsync('user');

            if (storedToken && userData) {
                setToken(storedToken);
                setUser(JSON.parse(userData));
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, userData: User) => {
        setIsLoading(true);
        try {
            await SecureStore.setItemAsync('token', newToken);
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            setUser(userData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        setIsLoading(false);
        router.replace('/auth/login');
    };

    const register = async (userData: any) => {
        // Just a pass-through to API, login handles session
        return axios.post(`${API_URL}/auth/register`, userData);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};
