import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiRequest } from '@/lib/api';
import type { User } from '@/types/academic';
import type { LoginApiUser } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'student' | 'employee') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'auth_user';
const TOKEN_STORAGE_KEY = 'auth_token';

function mapApiUserToSession(apiUser: LoginApiUser, role: 'student' | 'employee'): User {
  return {
    id: String(apiUser.idUser),
    email: apiUser.email,
    name: apiUser.name,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedUser || !storedToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    } catch (error) {
      console.error('Error parsing stored auth session:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const login = async (email: string, password: string, role: 'student' | 'employee') => {
    const { response, body } = await apiRequest<LoginApiUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok || !body || body.hasError || !body.data) {
      throw new Error(body?.meta.message || 'No fue posible iniciar sesion.');
    }

    const authorizationHeader = response.headers.get('Authorization');

    if (!authorizationHeader) {
      throw new Error('La API no devolvio el token de autenticacion.');
    }

    const authenticatedUser = mapApiUserToSession(body.data, role);

    setUser(authenticatedUser);
    setToken(authorizationHeader);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, authorizationHeader);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
