"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type UseFormSetError,
} from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/http";
import {
  measurementUnitFormSchema,
  type MeasurementUnitFormValues,
} from "@/lib/schemas/measurement-units";
import { useMeasurementUnitsStore } from "@/lib/stores/measurement-units";
import { getErrorMessage } from "@/lib/utils/errors";
import {
  baseUnitFor,
  formatConversionFactor,
  isUnitType,
  normalizeUnitText,
  UNIT_TYPE_LABELS,
  UNIT_TYPES,
  type MeasurementUnit,
} from "@/lib/utils/measurement-units";

const FIELD_NAMES = [
  "name",
  "abbreviation",
  "unitType",
  "conversionFactorToBase",
] as const;

function applyFieldErrors(
  error: unknown,
  setError: UseFormSetError<MeasurementUnitFormValues>
): boolean {
  if (!(error instanceof ApiError) || !error.fieldErrors) return false;

  let applied = false;
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if ((FIELD_NAMES as readonly string[]).includes(field)) {
      setError(field as (typeof FIELD_NAMES)[number], {
        type: "server",
        message,
      });
      applied = true;
    }
  }
  return applied;
}

function toFactor(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface MeasurementUnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: MeasurementUnit;
}

export function MeasurementUnitFormDialog({
  open,
  onOpenChange,
  unit,
}: MeasurementUnitFormDialogProps) {
  const units = useMeasurementUnitsStore((state) => state.units);
  const createUnit = useMeasurementUnitsStore((state) => state.createUnit);
  const updateUnit = useMeasurementUnitsStore((state) => state.updateUnit);
  const isMutating = useMeasurementUnitsStore((state) => state.isMutating);
  const isEdit = !!unit;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MeasurementUnitFormValues>({
    resolver: zodResolver(measurementUnitFormSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      unitType: "WEIGHT",
      conversionFactorToBase: 1,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: unit?.name ?? "",
      abbreviation: unit?.abbreviation ?? "",
      unitType:
        unit && isUnitType(unit.unitType) ? unit.unitType : "WEIGHT",
      conversionFactorToBase:
        typeof unit?.conversionFactorToBase === "number"
          ? unit.conversionFactorToBase
          : 1,
    });
  }, [open, unit, reset]);

  const unitType = useWatch({ control, name: "unitType" });
  const abbreviation = useWatch({ control, name: "abbreviation" });
  const factor = useWatch({ control, name: "conversionFactorToBase" });

  const base = baseUnitFor(unitType);
  const showPreview =
    !!base && typeof factor === "number" && Number.isFinite(factor) && factor > 0;

  async function onSubmit(values: MeasurementUnitFormValues) {
    const others = units.filter((item) => item.id !== unit?.id);
    const normalizedName = normalizeUnitText(values.name);
    const normalizedAbbreviation = normalizeUnitText(values.abbreviation);
    const duplicateName = others.some(
      (item) => normalizeUnitText(item.name) === normalizedName
    );
    const duplicateAbbreviation = others.some(
      (item) => normalizeUnitText(item.abbreviation) === normalizedAbbreviation
    );

    if (duplicateName) {
      setError("name", {
        type: "manual",
        message: "Ya existe una unidad con ese nombre",
      });
    }
    if (duplicateAbbreviation) {
      setError("abbreviation", {
        type: "manual",
        message: "Ya existe una unidad con esa abreviatura",
      });
    }
    if (duplicateName || duplicateAbbreviation) return;

    try {
      if (isEdit && unit?.id) {
        await updateUnit(unit.id, values);
        toast.success("Unidad de medida actualizada");
      } else {
        await createUnit(values);
        toast.success("Unidad de medida creada");
      }
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, setError)) {
        toast.error(
          getErrorMessage(error, "No se pudo guardar la unidad de medida")
        );
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            {isEdit ? "Editar unidad de medida" : "Nueva unidad de medida"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza el nombre, la abreviatura o la equivalencia"
              : "Si la unidad es estándar, revisa primero el catálogo inicial. Usa este formulario para unidades propias del negocio."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="unit-name">Nombre</Label>
            <Input
              id="unit-name"
              placeholder="Ej.: Kilogramo"
              maxLength={100}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <div className="space-y-2">
              <Label htmlFor="unit-type">Magnitud</Label>
              <Controller
                control={control}
                name="unitType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(isUnitType(value) ? value : "WEIGHT")
                    }
                  >
                    <SelectTrigger
                      id="unit-type"
                      className="w-full"
                      aria-invalid={!!errors.unitType}
                    >
                      <SelectValue placeholder="Selecciona la magnitud" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {UNIT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unitType && (
                <p className="text-sm text-destructive">
                  {errors.unitType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-abbreviation">Abreviatura</Label>
              <Input
                id="unit-abbreviation"
                placeholder="Ej.: kg"
                maxLength={10}
                aria-invalid={!!errors.abbreviation}
                {...register("abbreviation")}
              />
              {errors.abbreviation && (
                <p className="text-sm text-destructive">
                  {errors.abbreviation.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-factor">Factor a la unidad base</Label>
            <Input
              id="unit-factor"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="1"
              aria-invalid={!!errors.conversionFactorToBase}
              {...register("conversionFactorToBase", { setValueAs: toFactor })}
            />
            <p className="text-xs text-muted-foreground">
              {base
                ? `La unidad base de ${UNIT_TYPE_LABELS[unitType].toLowerCase()} es ${base.name} (${base.abbreviation}). `
                : ""}
              Se guarda para compatibilidad con el backend (hasta 10
              decimales); esta versión no realiza conversiones automáticas.
            </p>
            {errors.conversionFactorToBase && (
              <p className="text-sm text-destructive">
                {errors.conversionFactorToBase.message}
              </p>
            )}
          </div>

          {showPreview && base && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Equivalencia: </span>1{" "}
              {abbreviation?.trim() || "unidad"} ={" "}
              {formatConversionFactor(Number(factor))} {base.abbreviation}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear unidad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
