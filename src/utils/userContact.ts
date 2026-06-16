import type { Usuario } from '../services/api/login.service';

export type UserSessionContact = {
  userId: string;
  userMail: string;
  userPhoneNumber: string;
};

export function userContactFromAuth(
  user: Usuario | null,
  phoneNumber = ''
): UserSessionContact {
  if (!user) {
    return { userId: '', userMail: '', userPhoneNumber: '' };
  }
  return {
    userId: user.id,
    userMail: user.mail?.trim() ?? '',
    userPhoneNumber: phoneNumber.trim(),
  };
}

export function readPhoneFromStoredUser(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const o = raw as { celular?: string; telefono?: string };
  return (o.celular ?? o.telefono ?? '').trim();
}
