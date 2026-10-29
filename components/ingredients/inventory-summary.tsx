"use client";

import {
  Boxes,
  Mail,
  MailWarning,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/dates";
import {
  notificationStatusLabel,
  notificationStatusTextTone,
  notificationStatusTone,
  type StockNotification,
} from "@/lib/utils/ingredients";

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone: string;
  valueTone?: string;
  loading?: boolean;
  unavailable?: boolean;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
  valueTone,
  loading,
  unavailable,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "bg-card py-0 ring-1 ring-border",
        unavailable && "ring-hub-neon-red/30"
      )}
      aria-busy={loading || undefined}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            tone
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-title text-2xl font-semibold text-foreground",
              valueTone
            )}
          >
            {value}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface InventorySummaryProps {
  totalIngredients: number | null;
  lowStockCount: number | null;
  openAlertsCount: number | null;
  latestNotification?: StockNotification;
  ingredientsLoading: boolean;
  lowStockLoading: boolean;
  alertsLoading: boolean;
  ingredientsError: boolean;
  lowStockError: boolean;
  alertsError: boolean;
}

function countValue(
  value: number | null,
  loading: boolean,
  error: boolean
): string {
  if (error) return "—";
  if (loading && value === null) return "—";
  return value === null ? "—" : String(value);
}

function countDescription(
  loading: boolean,
  error: boolean,
  loadingLabel: string,
  description: string
): string {
  if (error) return "No disponible";
  if (loading) return loadingLabel;
  return description;
}

export function InventorySummary({
  totalIngredients,
  lowStockCount,
  openAlertsCount,
  latestNotification,
  ingredientsLoading,
  lowStockLoading,
  alertsLoading,
  ingredientsError,
  lowStockError,
  alertsError,
}: InventorySummaryProps) {
  const notificationDescription = alertsError
    ? "El servidor falló"
    : alertsLoading
      ? "Consultando..."
      : latestNotification
        ? formatDateTime(
            latestNotification.sentAt ?? latestNotification.createdAt
          )
        : "Aún no hay envíos registrados";

  return (
    <div
      className="grid gap-3 @md:grid-cols-2 @4xl:grid-cols-4"
      aria-label="Resumen del inventario"
    >
      <SummaryCard
        icon={Boxes}
        label="Total ingredientes"
        value={countValue(
          totalIngredients,
          ingredientsLoading,
          ingredientsError
        )}
        description={countDescription(
          ingredientsLoading,
          ingredientsError,
          "Consultando...",
          "Registrados en el inventario"
        )}
        tone="bg-primary/15 text-hub-electric-soft"
        loading={ingredientsLoading}
        unavailable={ingredientsError}
      />

      <SummaryCard
        icon={TriangleAlert}
        label="Stock bajo"
        value={countValue(lowStockCount, lowStockLoading, lowStockError)}
        description={countDescription(
          lowStockLoading,
          lowStockError,
          "Consultando...",
          lowStockCount === 0
            ? "Sin ingredientes por reponer"
            : "Requieren reposición"
        )}
        tone="bg-hub-neon-red/15 text-hub-neon-red"
        valueTone={
          !lowStockError && lowStockCount !== null && lowStockCount > 0
            ? "text-hub-neon-red"
            : undefined
        }
        loading={lowStockLoading}
        unavailable={lowStockError}
      />

      <SummaryCard
        icon={MailWarning}
        label="Alertas abiertas"
        value={countValue(openAlertsCount, alertsLoading, alertsError)}
        description={countDescription(
          alertsLoading,
          alertsError,
          "Consultando...",
          "Stock bajo sin correo confirmado"
        )}
        tone="bg-hub-mist/15 text-hub-mist"
        loading={alertsLoading}
        unavailable={alertsError}
      />

      <SummaryCard
        icon={Mail}
        label="Correo de alertas"
        value={
          alertsError
            ? "No disponible"
            : alertsLoading && !latestNotification
              ? "Consultando..."
              : latestNotification
                ? notificationStatusLabel(latestNotification.status)
                : "Sin registros"
        }
        description={notificationDescription}
        tone={notificationStatusTone(latestNotification?.status)}
        valueTone={
          latestNotification
            ? notificationStatusTextTone(latestNotification.status)
            : undefined
        }
        loading={alertsLoading}
        unavailable={alertsError || latestNotification?.status === "FAILED"}
      />
    </div>
  );
}
