"use client";

import { useEffect } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type UseFormSetError,
} from "react-hook-form";
import { AlertCircle } from "lucide-react";
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
import { StepperControls } from "@/components/ingredients/stepper-controls";
import { ApiError } from "@/lib/api/http";
import {
  ingredientFormSchema,
  type IngredientFormValues,
} from "@/lib/schemas/ingredients";
import {
  useCreateIngredient,
  useUpdateIngredient,
} from "@/lib/hooks/useIngredients";
import { useAuthStore } from "@/lib/stores/auth";
import { useMeasurementUnitsStore } from "@/lib/stores/measurement-units";
import {
  ingredientUnitLabel,
  type Ingredient,
  type IngredientRequest,
} from "@/lib/utils/ingredients";
import {
  unitTypeLabel,
  type MeasurementUnit,
} from "@/lib/utils/measurement-units";

const FIELD_NAMES = [
  "name",
  "unitId",
  "price",
  "currentStock",
  "minimumStock",
] as const;

/**
 * Clase compartida para los campos `type="number"`.
 *
 * Las flechas nativas del navegador se ocultan porque el formulario usa los
 * controles de incremento propios (`StepperControls`); `pr-10` deja el espacio
 * necesario para los botones.
 */
const NUMBER_INPUT_CLASS =
  "pr-10 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function applyFieldErrors(
  error: unknown,
  setError: UseFormSetError<IngredientFormValues>
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

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

type NumericField = "price" | "currentStock" | "minimumStock";

function stepDecimals(step: number): number {
  return step.toString().split(".")[1]?.length ?? 0;
}

function unitOptionLabel(unit: MeasurementUnit): string {
  const name = unit.name?.trim() || "Sin nombre";
  return unit.abbreviation ? `${name} (${unit.abbreviation})` : name;
}

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient;
}

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient,
}: IngredientFormDialogProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const units = useMeasurementUnitsStore((state) => state.units);
  const unitsLoading = useMeasurementUnitsStore((state) => state.isLoading);
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const isEdit = !!ingredient;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      unitId: "",
      price: 0,
      currentStock: 0,
      minimumStock: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: ingredient?.name ?? "",
      unitId: ingredient?.unitId ?? "",
      price: ingredient?.price ?? 0,
      currentStock: ingredient?.currentStock ?? 0,
      minimumStock: ingredient?.minimumStock ?? 0,
    });
  }, [open, ingredient, reset]);

  const unitId = useWatch({ control, name: "unitId" });
  const selectedUnit = units.find((unit) => unit.id === unitId);
  const selectedUnitLabel = selectedUnit
    ? unitOptionLabel(selectedUnit)
    : undefined;
  const stockUnit = selectedUnit
    ? selectedUnit.name?.trim() ||
      selectedUnit.abbreviation?.trim() ||
      "Sin unidad"
    : ingredient
      ? ingredient.unitName?.trim() ||
        ingredient.unitAbbreviation?.trim() ||
        ingredientUnitLabel(ingredient)
      : "Sin unidad";

  const noUnits = !unitsLoading && units.length === 0;

  function applyStep(
    name: NumericField,
    direction: 1 | -1,
    step: number,
    min: number,
    max: number
  ) {
    const raw = getValues(name);
    const current =
      typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    const next = Math.min(max, Math.max(min, current + direction * step));

    setValue(name, Number(next.toFixed(stepDecimals(step))), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: IngredientFormValues) {
    if (units.length === 0) {
      toast.error(
        isAdmin
          ? "Primero registra una unidad de medida"
          : "Un administrador debe registrar una unidad de medida"
      );
      return;
    }

    const body: IngredientRequest = {
      name: values.name.trim(),
      unitId: values.unitId,
      price: values.price,
      currentStock: values.currentStock,
      minimumStock: values.minimumStock,
    };

    try {
      if (isEdit && ingredient?.id) {
        await updateIngredient.mutateAsync({ id: ingredient.id, body });
      } else {
        await createIngredient.mutateAsync(body);
      }
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, setError)) {
        toast.error(
          "El servidor falló. No se pudo guardar el ingrediente."
        );
      }
    }
  }

  const pending = createIngredient.isPending || updateIngredient.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            {isEdit ? "Editar ingrediente" : "Nuevo ingrediente"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos y el stock del ingrediente"
              : "Registra el ingrediente con su unidad y niveles de stock"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {noUnits && (
            <div className="flex items-start gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-hub-neon-red" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  No hay unidades de medida disponibles
                </p>
                <p className="mt-0.5">
                  {isAdmin ? (
                    <>
                      Registra una unidad en{" "}
                      <Link
                        href="/unidades-medida"
                        className="font-medium text-hub-electric-soft hover:underline"
                      >
                        Unidades de medida
                      </Link>{" "}
                      antes de crear ingredientes.
                    </>
                  ) : (
                    "Un administrador debe registrar una unidad antes de crear ingredientes."
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ingredient-name">Nombre</Label>
            <Input
              id="ingredient-name"
              placeholder="Ej.: Harina, tomate, aceite..."
              maxLength={100}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredient-unit">Unidad de medida</Label>
            <Controller
              control={control}
              name="unitId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="ingredient-unit"
                    className="w-full"
                    aria-invalid={!!errors.unitId}
                    disabled={unitsLoading || units.length === 0}
                  >
                    <SelectValue
                      placeholder={
                        unitsLoading
                          ? "Cargando unidades..."
                          : "Selecciona una unidad"
                      }
                    >
                      {selectedUnitLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {units
                      .filter(
                        (unit): unit is MeasurementUnit & { id: string } =>
                          !!unit.id
                      )
                      .map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unitOptionLabel(unit)} ·{" "}
                          {unitTypeLabel(unit.unitType)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unitId && (
              <p className="text-sm text-destructive">
                {errors.unitId.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              La unidad proviene del catálogo compartido. No se realizan
              conversiones automáticas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredient-price">Precio (BOB)</Label>
            <div className="relative">
              <Input
                id="ingredient-price"
                type="number"
                inputMode="decimal"
                min="0"
                max="99999999.99"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.price}
                className={NUMBER_INPUT_CLASS}
                {...register("price", { setValueAs: toNumber })}
              />
              <StepperControls
                incrementLabel="Aumentar precio"
                decrementLabel="Disminuir precio"
                onIncrement={() =>
                  applyStep("price", 1, 0.01, 0, 99999999.99)
                }
                onDecrement={() =>
                  applyStep("price", -1, 0.01, 0, 99999999.99)
                }
                disabled={pending}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ingredient-current-stock">Stock actual</Label>
              <div className="relative">
                <Input
                  id="ingredient-current-stock"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="9999999999.99"
                  step="1"
                  placeholder="0"
                  aria-invalid={!!errors.currentStock}
                  className={NUMBER_INPUT_CLASS}
                  {...register("currentStock", { setValueAs: toNumber })}
                />
                <StepperControls
                  incrementLabel="Aumentar stock actual"
                  decrementLabel="Disminuir stock actual"
                  onIncrement={() =>
                    applyStep("currentStock", 1, 1, 0, 9999999999.99)
                  }
                  onDecrement={() =>
                    applyStep("currentStock", -1, 1, 0, 9999999999.99)
                  }
                  disabled={pending}
                />
              </div>
              {errors.currentStock && (
                <p className="text-sm text-destructive">
                  {errors.currentStock.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredient-minimum-stock">Stock mínimo</Label>
              <div className="relative">
                <Input
                  id="ingredient-minimum-stock"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="9999999999.99"
                  step="1"
                  placeholder="0"
                  aria-invalid={!!errors.minimumStock}
                  className={NUMBER_INPUT_CLASS}
                  {...register("minimumStock", { setValueAs: toNumber })}
                />
                <StepperControls
                  incrementLabel="Aumentar stock mínimo"
                  decrementLabel="Disminuir stock mínimo"
                  onIncrement={() =>
                    applyStep("minimumStock", 1, 1, 0, 9999999999.99)
                  }
                  onDecrement={() =>
                    applyStep("minimumStock", -1, 1, 0, 9999999999.99)
                  }
                  disabled={pending}
                />
              </div>
              {errors.minimumStock && (
                <p className="text-sm text-destructive">
                  {errors.minimumStock.message}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {stockUnit && stockUnit !== "Sin unidad"
              ? `Los stocks se expresan en ${stockUnit}. `
              : ""}
            El sistema considera stock bajo cuando el stock actual es
            estrictamente menor al mínimo.
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || units.length === 0}
            >
              {pending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear ingrediente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
