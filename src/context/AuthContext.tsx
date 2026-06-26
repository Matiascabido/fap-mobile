import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { tokenStorage, userStorage, clearClientSession } from '../services/api/storage';
import { loginService, Usuario } from '../services/api/login.service';
import { setUnauthorizedCallback } from '../services/api/http';
import { isJwtExpired } from '../utils/jwt';
import { patchUserData } from '../utils/userSessionStorage';
import { getUsuarioPerfil } from '../services/api/users.service';
import { getUserId } from '../utils/userId';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profilePhotoUrl: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (patch: Partial<Usuario>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  bumpProfilePhotoCache: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function withCacheBust(url: string, cacheKey: number): string {
  if (cacheKey <= 0) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${cacheKey}`;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhotoCacheKey, setProfilePhotoCacheKey] = useState(0);

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getToken();
      const userData = await userStorage.getUser();

      if (token && userData) {
        if (isJwtExpired(token)) {
          await clearClientSession();
          setUser(null);
        } else {
          setUser(userData);
        }
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

  const login = async (username: string, password: string) => {
    try {
      const userData = await loginService.login(username, password);
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
      setProfilePhotoCacheKey(0);
    } catch (error) {
      console.error('Error during logout:', error);
      await clearClientSession();
      setUser(null);
      setProfilePhotoCacheKey(0);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = useCallback(async (patch: Partial<Usuario>) => {
    const updated = await patchUserData(patch);
    if (updated) {
      setUser(updated);
    }
  }, []);

  const bumpProfilePhotoCache = useCallback(() => {
    setProfilePhotoCacheKey(Date.now());
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const userId = getUserId(user);
    if (!userId) return;
    try {
      const perfil = await getUsuarioPerfil(userId);
      const apiFoto = perfil.foto_url?.trim();
      if (apiFoto && apiFoto !== user?.foto_url?.trim()) {
        await updateUser({ foto_url: apiFoto });
      }
    } catch {
      /* perfil remoto opcional al abrir pantalla */
    }
  }, [user, updateUser]);

  const profilePhotoUrl = useMemo(() => {
    const raw = user?.foto_url?.trim();
    if (!raw) return null;
    return withCacheBust(raw, profilePhotoCacheKey);
  }, [user?.foto_url, profilePhotoCacheKey]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    profilePhotoUrl,
    login,
    logout,
    checkAuth,
    updateUser,
    refreshUserProfile,
    bumpProfilePhotoCache,
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
