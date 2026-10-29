"use client";

import {
  AlertCircle,
  Clock,
  Mail,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/dates";
import {
  alertStatusTone,
  countAlertsByStatus,
  latestNotification,
  notificationErrorDescription,
  notificationStatusLabel,
  notificationStatusTone,
  type StockAlertOverview,
} from "@/lib/utils/ingredients";

interface StockAlertPanelProps {
  overview?: StockAlertOverview;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRetry: () => void;
}

export function StockAlertPanel({
  overview,
  loading,
  error,
  refreshing,
  onRetry,
}: StockAlertPanelProps) {
  const counts = countAlertsByStatus(overview);
  const notification = latestNotification(overview);
  const notificationError = notification
    ? notificationErrorDescription(notification)
    : null;

  return (
    <Card className="bg-card py-0 ring-1 ring-border">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-hub-electric-soft">
              <Mail className="size-5" />
            </span>
            <div>
              <h2 className="font-title text-lg font-semibold text-foreground">
                Estado de las alertas por correo
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                El sistema gestiona los envíos. Esta vista solo muestra el
                estado registrado.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn(refreshing && "animate-spin")} />
            Actualizar
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-hub-neon-red" />
              <div>
                <p className="font-medium text-foreground">
                  No se pudo consultar el estado de las alertas
                </p>
                <p className="text-sm text-muted-foreground">
                  No se muestran datos de correo sin confirmación del
                  servidor.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={refreshing}
            >
              <RefreshCw className={cn(refreshing && "animate-spin")} />
              Reintentar
            </Button>
          </div>
        )}

        {!error && loading && !overview && (
          <div
            className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
            aria-busy
          >
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          </div>
        )}

        {!error && overview && (
          <>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  alertStatusTone("OPEN")
                )}
              >
                <TriangleAlert className="size-3.5" />
                Abiertas: {counts.open}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  alertStatusTone("NOTIFIED")
                )}
              >
                Notificadas: {counts.notified}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  alertStatusTone("RESOLVED")
                )}
              >
                Resueltas: {counts.resolved}
              </span>
            </div>

            {!notification && (
              <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    Aún no hay notificaciones registradas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cuando el sistema envíe una alerta, su estado aparecerá
                    aquí. La existencia de stock bajo no confirma un envío.
                  </p>
                </div>
              </div>
            )}

            {notification && (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Última notificación
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(
                        notification.sentAt ?? notification.createdAt
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      notificationStatusTone(notification.status)
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {notificationStatusLabel(notification.status)}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Ingredientes incluidos
                    </dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {notification.ingredientCount ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Intentos</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {notification.attemptCount ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Próximo intento
                    </dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {notification.nextAttemptAt
                        ? formatDateTime(notification.nextAttemptAt)
                        : "No programado"}
                    </dd>
                  </div>
                </dl>

                {notificationError && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-md border border-hub-neon-red/30 bg-hub-neon-red/10 p-3 text-sm text-muted-foreground"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-hub-neon-red" />
                    <div>
                      <p className="font-medium text-foreground">
                        {notificationError}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                        <Clock className="size-3.5" />
                        {notification.nextAttemptAt
                          ? `Próximo reintento: ${formatDateTime(
                              notification.nextAttemptAt
                            )}`
                          : "No hay más reintentos programados."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
