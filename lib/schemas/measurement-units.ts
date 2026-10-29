import { z } from "zod";
import { UNIT_TYPES } from "@/lib/utils/measurement-units";

function decimalPlaces(value: number): number {
  const [coefficient, exponentPart] = value.toString().toLowerCase().split("e");
  const fractionLength = coefficient.split(".")[1]?.length ?? 0;
  if (exponentPart === undefined) return fractionLength;

  return Math.max(0, fractionLength - Number(exponentPart));
}

export const measurementUnitFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  abbreviation: z
    .string()
    .trim()
    .min(1, "La abreviatura es obligatoria")
    .max(10, "La abreviatura no puede superar los 10 caracteres"),
  unitType: z.enum(UNIT_TYPES),
  conversionFactorToBase: z
    .number()
    .positive("El factor debe ser mayor a 0")
    .max(9999999999, "El factor es demasiado grande")
    .refine(
      (value) => decimalPlaces(value) <= 10,
      "El factor admite hasta 10 decimales"
    ),
});

export type MeasurementUnitFormValues = z.infer<
  typeof measurementUnitFormSchema
>;
