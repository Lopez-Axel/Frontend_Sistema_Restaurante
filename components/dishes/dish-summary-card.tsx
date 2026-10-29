"use client";

import { AlertCircle, ChartPie, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDishSummary } from "@/lib/hooks/useDishes";
import { formatAmount } from "@/lib/utils/money";
import { dishStatusLabel, dishStatusTone } from "@/lib/utils/dishes";

const percentFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
});

interface DishSummaryCardProps {
  dishId: string;
}

/**
 * Resumen del plato (`GET /dishes/{id}/summary`). El backend lo restringe a
 * ADMIN porque incluye costos y margen.
 */
export function DishSummaryCard({ dishId }: DishSummaryCardProps) {
  const summaryQuery = useDishSummary(dishId);
  const summary = summaryQuery.data;

  return (
    <Card className="bg-card py-0 ring-1 ring-border">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-title flex items-center gap-2 text-lg text-foreground">
            <ChartPie
              className="size-5 shrink-0 text-hub-electric-soft"
              aria-hidden="true"
            />
            Resumen del plato
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void summaryQuery.refetch()}
            disabled={summaryQuery.isFetching}
            aria-label="Actualizar el resumen del plato"
          >
            <RefreshCw
              className={summaryQuery.isFetching ? "animate-spin" : undefined}
            />
          </Button>
        </div>

        {summaryQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 py-8 text-center"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-hub-neon-red/15">
              <AlertCircle className="size-5 text-hub-neon-red" />
            </span>
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el resumen del plato
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void summaryQuery.refetch()}
            >
              <RefreshCw />
              Reintentar
            </Button>
          </div>
        ) : summaryQuery.isLoading ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : summary ? (
          <>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Margen
                </dt>
                <dd className="font-title mt-1 text-lg text-foreground tabular-nums">
                  {summary.marginPercent === null ||
                  summary.marginPercent === undefined
                    ? "—"
                    : `${percentFormatter.format(summary.marginPercent)} %`}
                </dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Precio sugerido
                </dt>
                <dd className="font-title mt-1 text-lg text-foreground tabular-nums">
                  {formatAmount(summary.suggestedSellingPrice)}
                </dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Costo calculado
                </dt>
                <dd className="font-title mt-1 text-lg text-foreground tabular-nums">
                  {formatAmount(summary.productionCost)}
                </dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Precio de venta
                </dt>
                <dd className="font-title mt-1 text-lg text-hub-neon-green tabular-nums">
                  {formatAmount(summary.sellingPrice)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              {summary.status && (
                <Badge className={dishStatusTone(summary.status)}>
                  {dishStatusLabel(summary.status)}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {summary.ingredients?.length ?? 0} ingrediente
                {(summary.ingredients?.length ?? 0) === 1 ? "" : "s"} en la
                receta
              </span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
