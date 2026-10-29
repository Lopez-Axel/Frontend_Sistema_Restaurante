"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertCircle,
  Calculator,
  Info,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepperControls } from "@/components/ingredients/stepper-controls";
import {
  dishSellingPriceSchema,
  type DishSellingPriceValues,
} from "@/lib/schemas/dishes";
import {
  useDishCostAnalysis,
  useRecomputeDishProductionCost,
  useUpdateDishSellingPrice,
} from "@/lib/hooks/useDishes";
import { getErrorMessage } from "@/lib/utils/errors";
import { formatAmount } from "@/lib/utils/money";
import { clampStep, NUMBER_INPUT_CLASS } from "@/lib/utils/numeric";
import { dishStatusLabel, dishStatusTone, type Dish } from "@/lib/utils/dishes";

const percentFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
});

function marginPercent(
  productionCost?: number | null,
  sellingPrice?: number | null
): number | null {
  if (
    sellingPrice === null ||
    sellingPrice === undefined ||
    !productionCost
  ) {
    return null;
  }
  return ((sellingPrice - productionCost) / productionCost) * 100;
}

interface DishCostAnalysisProps {
  dishId: string;
  dish?: Dish;
}

/**
 * Panel administrativo de costos.
 *
 * El modelo del backend tiene un único campo `productionCost`: el costo
 * guardado puede venir de una carga manual o del recálculo, y la interfaz
 * nunca infiere el origen. Recalcular es una acción explícita que sobrescribe
 * el valor guardado; el análisis, en cambio, es una consulta que no persiste
 * nada.
 */
export function DishCostAnalysis({ dishId, dish }: DishCostAnalysisProps) {
  const analysisQuery = useDishCostAnalysis(dishId);
  const recompute = useRecomputeDishProductionCost();
  const updateSellingPrice = useUpdateDishSellingPrice();

  const [priceError, setPriceError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<DishSellingPriceValues>({
    resolver: zodResolver(dishSellingPriceSchema),
    defaultValues: { sellingPrice: "" },
  });

  const analysis = analysisQuery.data;
  const suggestedPrice = analysis?.suggestedSellingPrice;
  const currentPrice = analysis?.currentSellingPrice;
  const calculatedCost = analysis?.productionCost;
  const savedCost = dish?.productionCost;

  const currentPriceValue = useWatch({ control, name: "sellingPrice" });

  useEffect(() => {
    if (analysis) {
      reset({
        sellingPrice:
          analysis.currentSellingPrice === null ||
          analysis.currentSellingPrice === undefined
            ? ""
            : String(analysis.currentSellingPrice),
      });
    }
  }, [analysis, reset]);

  async function handleRecompute() {
    try {
      await recompute.mutateAsync(dishId);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "No se pudo recalcular el costo de producción")
      );
    }
  }

  async function onSubmit(values: DishSellingPriceValues) {
    setPriceError(null);
    const price = Number(values.sellingPrice.trim());
    if (!Number.isFinite(price)) return;

    try {
      await updateSellingPrice.mutateAsync({ id: dishId, sellingPrice: price });
    } catch (error) {
      setPriceError(
        getErrorMessage(error, "No se pudo actualizar el precio de venta")
      );
    }
  }

  function applySuggestedPrice() {
    if (suggestedPrice === null || suggestedPrice === undefined) return;
    setValue("sellingPrice", String(suggestedPrice), { shouldValidate: true });
  }

  function applyStep(
    direction: 1 | -1,
    step: number,
    min: number,
    max: number
  ) {
    const raw = getValues("sellingPrice");
    const parsed = raw?.trim() ? Number(raw) : Number.NaN;
    const next = clampStep(
      Number.isFinite(parsed) ? parsed : null,
      direction,
      step,
      min,
      max
    );
    setValue("sellingPrice", String(next), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const margin = marginPercent(calculatedCost, currentPrice);
  const pending = recompute.isPending || updateSellingPrice.isPending;

  return (
    <Card className="bg-card py-0 ring-1 ring-border">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-title flex items-center gap-2 text-lg text-foreground">
              <Calculator
                className="size-5 shrink-0 text-hub-electric-soft"
                aria-hidden="true"
              />
              Análisis de costos
            </h2>
            <p className="text-sm text-muted-foreground">
              Costo de producción, precio sugerido y margen
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analysis?.status && (
              <Badge className={dishStatusTone(analysis.status)}>
                {dishStatusLabel(analysis.status)}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void analysisQuery.refetch()}
              disabled={analysisQuery.isFetching}
            >
              <RefreshCw
                className={analysisQuery.isFetching ? "animate-spin" : undefined}
              />
              Analizar
            </Button>
          </div>
        </div>

        {analysisQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 py-10 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
              <AlertCircle className="size-6 text-hub-neon-red" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                No se pudo calcular el análisis de costos
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                El servidor falló. Inténtalo de nuevo.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void analysisQuery.refetch()}
            >
              <RefreshCw />
              Reintentar
            </Button>
          </div>
        ) : analysisQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Costo guardado"
                value={formatAmount(savedCost ?? undefined)}
                hint="Valor que tiene el plato ahora mismo"
              />
              <Metric
                label="Costo calculado"
                value={formatAmount(calculatedCost ?? undefined)}
                hint="Suma de los ingredientes de la receta"
              />
              <Metric
                label="Precio de venta"
                value={formatAmount(currentPrice ?? undefined)}
                hint="Precio vigente del plato"
                accent
              />
              <Metric
                label="Precio sugerido"
                value={formatAmount(suggestedPrice ?? undefined)}
                hint="Costo + margen por defecto del negocio"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
              <TrendingUp className="size-4 text-hub-electric-soft" />
              <span className="text-muted-foreground">Margen actual</span>
              <span className="font-medium text-foreground tabular-nums">
                {margin === null
                  ? "—"
                  : `${percentFormatter.format(margin)} %`}
              </span>
              <span className="text-xs text-muted-foreground">
                (precio de venta − costo calculado) ÷ costo calculado
              </span>
            </div>

            {/* Los apartados se apilan: cada bloque ocupa una fila completa. */}
            <div className="grid gap-4">
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-start gap-2">
                  <Calculator className="mt-0.5 size-4 shrink-0 text-hub-electric-soft" />
                  <div>
                    <p className="font-medium text-foreground">
                      Recalcular costo de producción
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toma las proporciones actuales de la receta y guarda el
                      resultado como costo del plato. Sobrescribe el costo
                      guardado.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRecompute}
                  disabled={pending}
                  className="w-full"
                >
                  <RefreshCw className={recompute.isPending ? "animate-spin" : undefined} />
                  {recompute.isPending
                    ? "Recalculando..."
                    : "Recalcular y guardar"}
                </Button>
              </div>

              <form
                className="space-y-3 rounded-lg border border-border p-3"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-hub-neon-green" />
                  <div>
                    <p className="font-medium text-foreground">
                      Precio de venta
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Se actualiza por el endpoint dedicado de precio de venta.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dish-cost-selling-price">
                    Precio de venta (BOB)
                  </Label>
                  <div className="relative">
                    <Input
                      id="dish-cost-selling-price"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="99999999.99"
                      step="0.01"
                      placeholder="0.00"
                      aria-invalid={!!errors.sellingPrice || !!priceError}
                      className={NUMBER_INPUT_CLASS}
                      {...register("sellingPrice")}
                    />
                    <StepperControls
                      incrementLabel="Aumentar precio de venta"
                      decrementLabel="Disminuir precio de venta"
                      onIncrement={() =>
                        applyStep(1, 0.01, 0, 99999999.99)
                      }
                      onDecrement={() =>
                        applyStep(-1, 0.01, 0, 99999999.99)
                      }
                      disabled={pending}
                    />
                  </div>
                  {errors.sellingPrice && (
                    <p className="text-sm text-destructive">
                      {errors.sellingPrice.message}
                    </p>
                  )}
                  {priceError && (
                    <p className="text-sm text-destructive">{priceError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={pending || !currentPriceValue.trim()}
                    className="flex-1"
                  >
                    {updateSellingPrice.isPending
                      ? "Guardando..."
                      : "Guardar precio"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applySuggestedPrice}
                    disabled={pending || suggestedPrice === undefined}
                    className="flex-1"
                  >
                    Usar precio sugerido
                  </Button>
                </div>
              </form>
            </div>

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              El costo de producción puede escribirse manualmente al editar el
              plato o recalcularse desde la receta. Son dos operaciones
              independientes: el valor guardado solo cambia cuando se ejecuta
              el recálculo.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          accent
            ? "font-title mt-1 text-xl text-hub-neon-green tabular-nums"
            : "font-title mt-1 text-xl text-foreground tabular-nums"
        }
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
