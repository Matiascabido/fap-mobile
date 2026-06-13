import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { tokenStorage, userStorage, clearClientSession } from '../services/api/storage';
import { loginService, Usuario } from '../services/api/login.service';
import { setUnauthorizedCallback } from '../services/api/http';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getToken();
      const userData = await userStorage.getUser();
      
      if (token && userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(() => {
      setUser(null);
    });
    return () => setUnauthorizedCallback(() => {});
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userData = await loginService.login(email, password);
      setUser(userData);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await loginService.logout();
      await clearClientSession();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Limpiar sesión local incluso si falla el backend
      await clearClientSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
