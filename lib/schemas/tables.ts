import { z } from "zod";

export const tableFormSchema = z.object({
  number: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe ser mayor a 0"),
  capacity: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe ser mayor a 0"),
});

export type TableFormValues = z.infer<typeof tableFormSchema>;