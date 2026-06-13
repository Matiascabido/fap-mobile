import { z } from 'zod';

/**
 * Schema de validación para el login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El usuario es obligatorio'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de validación para crear/editar socio
 */
export const socioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z.string().min(7, 'DNI inválido').max(8, 'DNI inválido'),
  mail: z.string().email('Email inválido'),
  celular: z.string().optional(),
});

export type SocioFormData = z.infer<typeof socioSchema>;

/**
 * Validaciones individuales reutilizables
 */
export const validators = {
  isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  isDNI(value: string): boolean {
    return /^\d{7,8}$/.test(value);
  },
  isPhone(value: string): boolean {
    return /^[\d+\s()-]{8,}$/.test(value);
  },
  isNotEmpty(value: string): boolean {
    return value.trim().length > 0;
  },
};
