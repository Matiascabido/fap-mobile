import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserId } from '../utils/userId';
import {
  getLocalDisplayName,
  loadLocalNickname,
  saveLocalNickname,
} from '../utils/localProfile';
import { MAX_LOCAL_NICKNAME_LENGTH } from '../types/localProfile.types';

interface LocalProfileContextValue {
  loading: boolean;
  nickname: string;
  displayName: string;
  hasNickname: boolean;
  setNickname: (value: string) => Promise<void>;
}

const LocalProfileContext = createContext<LocalProfileContextValue | undefined>(undefined);

export function LocalProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  const [loading, setLoading] = useState(true);
  const [nickname, setNicknameState] = useState('');

  const refresh = useCallback(async () => {
    if (!userId) {
      setNicknameState('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const nick = await loadLocalNickname(userId);
    setNicknameState(nick);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setNickname = useCallback(
    async (value: string) => {
      if (!userId) return;
      const trimmed = value.trim().slice(0, MAX_LOCAL_NICKNAME_LENGTH);
      setNicknameState(trimmed);
      await saveLocalNickname(userId, trimmed);
    },
    [userId]
  );

  const displayName = useMemo(
    () => getLocalDisplayName(nickname, user?.nombre, user?.apellido),
    [nickname, user?.nombre, user?.apellido]
  );

  const value: LocalProfileContextValue = {
    loading,
    nickname,
    displayName,
    hasNickname: nickname.trim().length > 0,
    setNickname,
  };

  return (
    <LocalProfileContext.Provider value={value}>{children}</LocalProfileContext.Provider>
  );
}

export function useLocalProfile() {
  const ctx = useContext(LocalProfileContext);
  if (!ctx) {
    throw new Error('useLocalProfile must be used within LocalProfileProvider');
  }
  return ctx;
}
