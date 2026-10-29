"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type UseFormSetError } from "react-hook-form";
import {
  AlertCircle,
  Carrot,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import { StepperControls } from "@/components/ingredients/stepper-controls";
import { ApiError } from "@/lib/api/http";
import type { DishIngredientRequest } from "@/lib/api/dishes";
import {
  dishIngredientFormSchema,
  type DishIngredientFormValues,
} from "@/lib/schemas/dishes";
import {
  useAddDishIngredient,
  useDishIngredients,
  useRemoveDishIngredient,
  useUpdateDishIngredient,
} from "@/lib/hooks/useDishes";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { useMeasurementUnitsStore } from "@/lib/stores/measurement-units";
import { getErrorMessage } from "@/lib/utils/errors";
import { clampStep, NUMBER_INPUT_CLASS } from "@/lib/utils/numeric";
import {
  dishIngredientUnitLabel,
  type DishIngredient,
} from "@/lib/utils/dishes";
import type { Ingredient } from "@/lib/utils/ingredients";
import type { MeasurementUnit } from "@/lib/utils/measurement-units";

const FIELD_NAMES = ["ingredientId", "estimatedQuantity", "unitId"] as const;

function applyFieldErrors(
  error: unknown,
  setError: UseFormSetError<DishIngredientFormValues>
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

function unitOptionLabel(unit: MeasurementUnit): string {
  const name = unit.name?.trim() || "Sin nombre";
  return unit.abbreviation ? `${name} (${unit.abbreviation})` : name;
}

interface DishIngredientsPanelProps {
  dishId: string;
  canManage?: boolean;
}

/**
 * Ingredientes y proporciones del plato.
 *
 * El backend expone `/dishes/{id}/ingredients` con permisos ADMIN, CHEF, así
 * que la carga de la lista se hace siempre y la gestión queda habilitada solo
 * para esos roles.
 */
export function DishIngredientsPanel({
  dishId,
  canManage = false,
}: DishIngredientsPanelProps) {
  const ingredientsQuery = useDishIngredients(dishId);
  const catalogQuery = useIngredients(canManage);
  const units = useMeasurementUnitsStore((state) => state.units);
  const loadUnits = useMeasurementUnitsStore((state) => state.loadUnits);

  const addIngredient = useAddDishIngredient();
  const updateIngredient = useUpdateDishIngredient();
  const removeIngredient = useRemoveDishIngredient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<DishIngredient | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setError,
    setValue,
    formState: { errors },
  } = useForm<DishIngredientFormValues>({
    resolver: zodResolver(dishIngredientFormSchema),
    defaultValues: {
      ingredientId: "",
      estimatedQuantity: 0,
      unitId: "",
    },
  });

  useEffect(() => {
    if (!canManage) return;
    void loadUnits();
  }, [canManage, loadUnits]);

  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const rows = useMemo(
    () => ingredientsQuery.data ?? [],
    [ingredientsQuery.data]
  );

  const selectedIngredientId = useWatch({ control, name: "ingredientId" });
  const selectedUnitId = useWatch({ control, name: "unitId" });

  const selectedIngredient = catalog.find(
    (ingredient) => ingredient.id === selectedIngredientId
  );
  const selectedIngredientLabel = selectedIngredient?.name?.trim();
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const selectedUnitLabel = selectedUnit ? unitOptionLabel(selectedUnit) : undefined;

  // El backend exige que la unidad de la proporción tenga la misma magnitud
  // que la unidad del ingrediente, así que se filtrationa el selector.
  const ingredientUnitType = selectedIngredient?.unitId
    ? units.find((unit) => unit.id === selectedIngredient.unitId)?.unitType
    : undefined;

  const availableUnits = useMemo(
    () =>
      ingredientUnitType
        ? units.filter((unit) => unit.unitType === ingredientUnitType)
        : units,
    [units, ingredientUnitType]
  );

  const pending =
    addIngredient.isPending ||
    updateIngredient.isPending ||
    removeIngredient.isPending;

  function handleIngredientChange(ingredientId: string) {
    setValue("ingredientId", ingredientId, { shouldValidate: true });
    const ingredient = catalog.find((item) => item.id === ingredientId);
    if (ingredient?.unitId) {
      setValue("unitId", ingredient.unitId, { shouldValidate: true });
    }
  }

  function applyStep(
    direction: 1 | -1,
    step: number,
    min: number,
    max: number
  ) {
    const next = clampStep(
      getValues("estimatedQuantity"),
      direction,
      step,
      min,
      max
    );
    setValue("estimatedQuantity", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function startEdit(row: DishIngredient) {
    if (!row.id) return;
    setEditingId(row.id);
    reset({
      ingredientId: row.ingredientId ?? "",
      estimatedQuantity: row.estimatedQuantity ?? 0,
      unitId: row.unitId ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    reset({ ingredientId: "", estimatedQuantity: 0, unitId: "" });
  }

  async function onSubmit(values: DishIngredientFormValues) {
    const body: DishIngredientRequest = {
      ingredientId: values.ingredientId,
      estimatedQuantity: values.estimatedQuantity,
      unitId: values.unitId,
    };

    try {
      if (editingId) {
        await updateIngredient.mutateAsync({
          dishId,
          dishIngredientId: editingId,
          body,
        });
        cancelEdit();
        return;
      }

      await addIngredient.mutateAsync({ id: dishId, body });
      reset({ ingredientId: "", estimatedQuantity: 0, unitId: "" });
    } catch (error) {
      if (!applyFieldErrors(error, setError)) {
        toast.error(
          getErrorMessage(error, "No se pudo guardar el ingrediente del plato")
        );
      }
    }
  }

  async function handleRemove() {
    if (!removing?.id) return;
    try {
      await removeIngredient.mutateAsync({
        dishId,
        dishIngredientId: removing.id,
      });
      setRemoving(null);
      if (editingId === removing.id) cancelEdit();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "No se pudo quitar el ingrediente del plato")
      );
    }
  }

  return (
    <Card className="bg-card py-0 ring-1 ring-border">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-title flex items-center gap-2 text-lg text-foreground">
              <Carrot
                className="size-5 shrink-0 text-hub-electric-soft"
                aria-hidden="true"
              />
              Ingredientes y proporciones
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} ingrediente{rows.length === 1 ? "" : "s"} en la
              receta
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void ingredientsQuery.refetch()}
            disabled={ingredientsQuery.isFetching}
          >
            <RefreshCw
              className={ingredientsQuery.isFetching ? "animate-spin" : undefined}
            />
            Actualizar
          </Button>
        </div>

        {ingredientsQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 py-10 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
              <AlertCircle className="size-6 text-hub-neon-red" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                No se pudieron cargar los ingredientes del plato
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                El servidor falló. Inténtalo de nuevo.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void ingredientsQuery.refetch()}
            >
              <RefreshCw />
              Reintentar
            </Button>
          </div>
        ) : ingredientsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id ?? row.ingredientId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {row.ingredientName?.trim() || "Ingrediente"}
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {row.estimatedQuantity ?? 0} {dishIngredientUnitLabel(row)}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(row)}
                      disabled={pending || !row.id}
                    >
                      <Pencil />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoving(row)}
                      disabled={pending || !row.id}
                    >
                      <Trash2 />
                      Quitar
                    </Button>
                  </div>
                )}
              </li>
            ))}
            {rows.length === 0 && (
              <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Este plato todavía no tiene ingredientes en su receta
              </li>
            )}
          </ul>
        )}

        {canManage && (
          <form
            className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-title text-sm font-semibold tracking-wide text-foreground uppercase">
                {editingId ? "Editar proporción" : "Agregar ingrediente"}
              </p>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                >
                  <X />
                  Cancelar
                </Button>
              )}
            </div>

            <div className="grid gap-3 @md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] @md:items-end">
              <div className="space-y-2">
                <Label htmlFor="dish-ingredient">Ingrediente</Label>
                <Controller
                  control={control}
                  name="ingredientId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value ?? "");
                        handleIngredientChange(value ?? "");
                      }}
                    >
                      <SelectTrigger
                        id="dish-ingredient"
                        className="w-full"
                        aria-invalid={!!errors.ingredientId}
                        disabled={catalogQuery.isLoading || catalog.length === 0}
                      >
                        <SelectValue
                          placeholder={
                            catalogQuery.isLoading
                              ? "Cargando ingredientes..."
                              : "Selecciona un ingrediente"
                          }
                        >
                          {selectedIngredientLabel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {catalog
                          .filter(
                            (ingredient): ingredient is Ingredient & {
                              id: string;
                            } => !!ingredient.id
                          )
                          .map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name?.trim() || "Sin nombre"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.ingredientId && (
                  <p className="text-sm text-destructive">
                    {errors.ingredientId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-ingredient-quantity">Cantidad</Label>
                <div className="relative">
                  <Input
                    id="dish-ingredient-quantity"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="9999999999.999999"
                    step="0.000001"
                    placeholder="0"
                    aria-invalid={!!errors.estimatedQuantity}
                    className={NUMBER_INPUT_CLASS}
                    {...register("estimatedQuantity", { setValueAs: toNumber })}
                  />
                  <StepperControls
                    incrementLabel="Aumentar cantidad"
                    decrementLabel="Disminuir cantidad"
                    onIncrement={() =>
                      applyStep(1, 0.000001, 0, 9999999999.999999)
                    }
                    onDecrement={() =>
                      applyStep(-1, 0.000001, 0, 9999999999.999999)
                    }
                    disabled={pending}
                  />
                </div>
                {errors.estimatedQuantity && (
                  <p className="text-sm text-destructive">
                    {errors.estimatedQuantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dish-ingredient-unit">Unidad</Label>
                <Controller
                  control={control}
                  name="unitId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        id="dish-ingredient-unit"
                        className="w-full"
                        aria-invalid={!!errors.unitId}
                        disabled={availableUnits.length === 0}
                      >
                        <SelectValue
                          placeholder={
                            availableUnits.length === 0
                              ? "Sin unidades del mismo tipo"
                              : "Selecciona una unidad"
                          }
                        >
                          {selectedUnitLabel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits
                          .filter(
                            (unit): unit is MeasurementUnit & { id: string } =>
                              !!unit.id
                          )
                          .map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unitOptionLabel(unit)}
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
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? (
                  "Guardando..."
                ) : editingId ? (
                  "Guardar"
                ) : (
                  <>
                    <Plus />
                    Agregar
                  </>
                )}
              </Button>
            </div>

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              Las proporciones alimentan el cálculo del costo de producción.
              El costo guardado solo cambia cuando un administrador recalcula
              el plato.
            </p>
          </form>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Quitar ingrediente"
        description={
          removing
            ? `Se quitará "${removing.ingredientName ?? "este ingrediente"}" de la receta del plato.`
            : ""
        }
        confirmLabel="Quitar"
        destructive
        pending={removeIngredient.isPending}
        onConfirm={handleRemove}
      />
    </Card>
  );
}
