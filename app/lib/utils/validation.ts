/**
 * Utilidades de validación para mejorar la seguridad de la aplicación
 */

import { z } from 'zod';

// Esquema de validación para el formulario de inicio de sesión
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Esquema de validación para el formulario de registro
export const registerSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
    ),
  confirmPassword: z.string(),
  role: z.enum(['student', 'teacher', 'admin']),
  division: z.string().optional(),
  year: z.number().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Esquema de validación para la actualización de perfil
export const profileUpdateSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine(
  data => {
    // Si se proporciona una nueva contraseña, validar que coincida con la confirmación
    if (data.newPassword) {
      return data.newPassword === data.confirmNewPassword;
    }
    return true;
  },
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  }
).refine(
  data => {
    // Si se proporciona una nueva contraseña, validar que tenga al menos 8 caracteres
    if (data.newPassword) {
      return data.newPassword.length >= 8;
    }
    return true;
  },
  {
    message: 'La contraseña debe tener al menos 8 caracteres',
    path: ['newPassword'],
  }
);

// Función para sanitizar entradas de texto (prevenir XSS)
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Función para validar y sanitizar entradas de formulario
export function validateAndSanitize<T>(schema: z.ZodType<T>, data: unknown): { success: boolean; data?: T; errors?: z.ZodError } {
  try {
    const validatedData = schema.parse(data);
    
    // Sanitizar campos de texto
    const sanitizedData = { ...validatedData };
    
    // Sanitizar solo campos de tipo string
    Object.keys(sanitizedData as object).forEach(key => {
      if (typeof sanitizedData[key as keyof T] === 'string') {
        sanitizedData[key as keyof T] = sanitizeInput(sanitizedData[key as keyof T] as string) as any;
      }
    });
    
    return { success: true, data: sanitizedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}