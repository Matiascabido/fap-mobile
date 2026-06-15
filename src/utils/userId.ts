/** ID de usuario unificado (login devuelve `id`; listados usan `id_usuario`). */
export function getUserId(user: { id?: string; id_usuario?: string } | null | undefined): string {
  if (!user) return '';
  return String(user.id ?? user.id_usuario ?? '').trim();
}
