import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido").optional().or(z.literal("")),
  lastName: z.string().min(1, "Apellido requerido").optional().or(z.literal("")),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().min(1, "Número de verificación requerido"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;