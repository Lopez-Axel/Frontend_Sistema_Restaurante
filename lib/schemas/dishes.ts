import { z } from "zod";

const MAX_MONEY = 99999999.99;

function decimalPlaces(value: number): number {
  const [coefficient, exponentPart] = value.toString().toLowerCase().split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  if (exponentPart === undefined) return fractionLength;

  return Math.max(0, fractionLength - Number(exponentPart));
}

export function isValidDecimal(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim());
}

// Los campos monetarios del formulario se manejan como texto para no perder
// el control del input numérico; se convierten al enviar.
export function parseMoneyField(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalMoneyField(label: string) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === "" || isValidDecimal(value),
      `Ingresa un ${label} válido`
    )
    .refine(
      (value) => value === "" || Number(value) >= 0,
      `El ${label} no puede ser negativo`
    )
    .refine(
      (value) => value === "" || Number(value) <= MAX_MONEY,
      `El ${label} es demasiado alto`
    )
    .refine(
      (value) => value === "" || decimalPlaces(Number(value)) <= 2,
      `El ${label} admite hasta 2 decimales`
    );
}

const baseDishFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  description: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(500, "La descripción no puede superar los 500 caracteres"),
  categoryId: z.string().trim().min(1, "La categoría es obligatoria"),
  sellingPrice: optionalMoneyField("precio de venta"),
  productionCost: optionalMoneyField("costo de producción"),
  available: z.boolean(),
});

export interface DishFormOptions {
  // Solo el ADMIN puede asignar precio de venta (el backend descarta el valor
  // recibido para CHEF), así que la regla "disponible exige precio" solo se
  // valida cuando el usuario puede introducirlo. Para el resto de roles el
  // backend decide y su mensaje se muestra junto al campo.
  canSetSellingPrice: boolean;
}

export function buildDishFormSchema(options: DishFormOptions) {
  return baseDishFormSchema.superRefine((values, ctx) => {
    if (!values.available) return;
    if (!options.canSetSellingPrice) return;
    if (!values.sellingPrice.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["sellingPrice"],
        message:
          "No se puede marcar el plato como disponible sin precio de venta",
      });
    }
  });
}

export const dishFormSchema = buildDishFormSchema({ canSetSellingPrice: true });

export type DishFormValues = z.infer<typeof baseDishFormSchema>;

export const dishSellingPriceSchema = z.object({
  sellingPrice: z
    .string()
    .trim()
    .min(1, "El precio de venta es obligatorio")
    .refine((value) => isValidDecimal(value), "Ingresa un precio de venta válido")
    .refine((value) => Number(value) >= 0, "El precio de venta no puede ser negativo")
    .refine(
      (value) => Number(value) <= MAX_MONEY,
      "El precio de venta es demasiado alto"
    )
    .refine(
      (value) => decimalPlaces(Number(value)) <= 2,
      "El precio de venta admite hasta 2 decimales"
    ),
});

export type DishSellingPriceValues = z.infer<typeof dishSellingPriceSchema>;

export const dishIngredientFormSchema = z.object({
  ingredientId: z.string().trim().min(1, "Selecciona un ingrediente"),
  estimatedQuantity: z
    .number({ error: "Ingresa una cantidad válida" })
    .min(0, "La cantidad no puede ser negativa")
    .max(9999999999.999999, "La cantidad es demasiado alta")
    .refine(
      (value) => decimalPlaces(value) <= 6,
      "La cantidad admite hasta 6 decimales"
    ),
  unitId: z.string().trim().min(1, "Selecciona una unidad de medida"),
});

export type DishIngredientFormValues = z.infer<typeof dishIngredientFormSchema>;
