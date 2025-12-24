import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface User {
    id: string;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check for existing token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Verify token is still valid by making a test request
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }

            // Small delay to prevent flash
            setTimeout(() => {
                setLoading(false);
            }, 300);
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                username,
                password
            });

            const { token: newToken, user: newUser } = response.data;

            // Store in localStorage
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            // Update state
            setToken(newToken);
            setUser(newUser);

            // Navigate to dashboard
            navigate('/');
        } catch (error: any) {
            const message = error.response?.data?.error || 'Login failed';
            throw new Error(message);
        }
    };

    const logout = () => {
        // Clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear state
        setToken(null);
        setUser(null);

        // Navigate to login
        navigate('/login');
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
