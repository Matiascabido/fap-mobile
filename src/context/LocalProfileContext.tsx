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
  loadLocalProfile,
  pickAndSaveProfilePhoto,
  removeProfilePhoto,
  saveLocalNickname,
} from '../utils/localProfile';
import { MAX_LOCAL_NICKNAME_LENGTH } from '../types/localProfile.types';

interface LocalProfileContextValue {
  loading: boolean;
  nickname: string;
  photoUri: string | null;
  displayName: string;
  hasNickname: boolean;
  setNickname: (value: string) => Promise<void>;
  pickPhoto: () => Promise<void>;
  removePhoto: () => Promise<void>;
}

const LocalProfileContext = createContext<LocalProfileContextValue | undefined>(undefined);

export function LocalProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = getUserId(user);
  const [loading, setLoading] = useState(true);
  const [nickname, setNicknameState] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNicknameState('');
      setPhotoUri(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await loadLocalProfile(userId);
    setNicknameState(data.nickname);
    setPhotoUri(data.photoUri);
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

  const pickPhoto = useCallback(async () => {
    if (!userId) return;
    const uri = await pickAndSaveProfilePhoto(userId);
    if (uri) setPhotoUri(uri);
  }, [userId]);

  const removePhoto = useCallback(async () => {
    if (!userId) return;
    await removeProfilePhoto(userId);
    setPhotoUri(null);
  }, [userId]);

  const displayName = useMemo(
    () => getLocalDisplayName(nickname, user?.nombre, user?.apellido),
    [nickname, user?.nombre, user?.apellido]
  );

  const value: LocalProfileContextValue = {
    loading,
    nickname,
    photoUri,
    displayName,
    hasNickname: nickname.trim().length > 0,
    setNickname,
    pickPhoto,
    removePhoto,
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
