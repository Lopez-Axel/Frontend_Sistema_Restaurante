import { z } from "zod";

function decimalPlaces(value: number): number {
  const [coefficient, exponentPart] = value.toString().toLowerCase().split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  if (exponentPart === undefined) return fractionLength;

  return Math.max(0, fractionLength - Number(exponentPart));
}

const priceSchema = z
  .number({ error: "Ingresa un precio válido" })
  .min(0, "El precio no puede ser negativo")
  .max(99999999.99, "El precio es demasiado alto")
  .refine(
    (value) => decimalPlaces(value) <= 2,
    "El precio admite hasta 2 decimales"
  );

const stockSchema = z
  .number({ error: "Ingresa un stock válido" })
  .min(0, "El stock no puede ser negativo")
  .max(9999999999.99, "El stock es demasiado alto")
  .refine(
    (value) => decimalPlaces(value) <= 2,
    "El stock admite hasta 2 decimales"
  );

export const ingredientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  unitId: z.string().trim().min(1, "Selecciona una unidad de medida"),
  price: priceSchema,
  currentStock: stockSchema,
  minimumStock: stockSchema,
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;
