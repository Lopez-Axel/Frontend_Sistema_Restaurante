import { z } from "zod";

export const menuFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  active: z.boolean(),
});

export type MenuFormValues = z.infer<typeof menuFormSchema>;
