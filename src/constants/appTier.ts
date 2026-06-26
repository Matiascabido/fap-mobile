export type AppTier = 'gratis' | 'plus' | 'premium' | 'elite';

const TIER_RANK: Record<AppTier, number> = {
  gratis: 0,
  plus: 1,
  premium: 2,
  elite: 3,
};

/** Tier del despliegue mobile (equivalente a PUBLIC_APP_TIER en web). */
export const APP_TIER: AppTier =
  (process.env.EXPO_PUBLIC_APP_TIER as AppTier | undefined) ?? 'elite';

export function isAppTierAtLeast(minTier: AppTier): boolean {
  return TIER_RANK[APP_TIER] >= TIER_RANK[minTier];
}

/** Feature perfil.foto requiere tier Elite. */
export function canUploadProfilePhoto(): boolean {
  return isAppTierAtLeast('elite');
}
