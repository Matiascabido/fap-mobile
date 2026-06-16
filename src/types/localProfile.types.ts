export interface LocalProfileData {
  nickname: string;
  photoUri: string | null;
}

export const MAX_LOCAL_NICKNAME_LENGTH = 32;
export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
