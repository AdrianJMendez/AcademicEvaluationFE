import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/types/academic';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'student' | 'employee') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios de ejemplo (simulando SSO de la universidad)
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'estudiante@universidad.edu',
    name: 'Juan Pérez',
    role: 'student',
    studentCode: '2020-0001',
  },
  {
    id: '2',
    email: 'maria@universidad.edu',
    name: 'María González',
    role: 'student',
    studentCode: '2019-0045',
  },
  {
    id: '3',
    email: 'admin@universidad.edu',
    name: 'Dr. Carlos Rodríguez',
    role: 'employee',
    employeeId: 'EMP-001',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restaurar sesión al cargar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string, role: 'student' | 'employee') => {
    // Simulación de autenticación SSO
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = MOCK_USERS.find(u => u.email === email && u.role === role);
    
    if (!foundUser) {
      throw new Error('Credenciales inválidas o rol incorrecto');
    }

    setUser(foundUser);
    localStorage.setItem('user', JSON.stringify(foundUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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