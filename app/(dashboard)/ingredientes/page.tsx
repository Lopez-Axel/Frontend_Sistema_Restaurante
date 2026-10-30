"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";
import robotIngrediente from "@/public/robot_ingrediente.png";
import { Footer, type FooterTip } from "@/components/layout/Footer";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import { InventorySummary } from "@/components/ingredients/inventory-summary";
import { IngredientFormDialog } from "@/components/ingredients/ingredient-form-dialog";
import { IngredientsTable } from "@/components/ingredients/ingredients-table";
import { StockAlertPanel } from "@/components/ingredients/stock-alert-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useDeleteIngredient,
  useIngredients,
  useLowStockIngredients,
  useStockAlertOverview,
} from "@/lib/hooks/useIngredients";
import { useAuthStore } from "@/lib/stores/auth";
import { useMeasurementUnitsStore } from "@/lib/stores/measurement-units";
import {
  countAlertsByStatus,
  latestNotification,
  lowStockIdSet,
  type Ingredient,
  type InventoryFilter,
} from "@/lib/utils/ingredients";
import { cn } from "cn";
import { toast } from "sonner";

function matchesSearch(ingredient: Ingredient, query: string): boolean {
  const term = query.trim().toLocaleLowerCase("es");
  if (!term) return true;

  return [ingredient.name, ingredient.unitName, ingredient.unitAbbreviation]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLocaleLowerCase("es").includes(term));
}

export default function IngredientesPage() {
  const user = useAuthStore((state) => state.user);
  const canRead = user?.role === "ADMIN" || user?.role === "CHEF";
  const permissionDenied = !!user && !canRead;

  const loadUnits = useMeasurementUnitsStore((state) => state.loadUnits);

  const ingredientsQuery = useIngredients(canRead);
  const lowStockQuery = useLowStockIngredients(canRead);
  const alertsQuery = useStockAlertOverview(canRead);
  const deleteIngredient = useDeleteIngredient();

  const [filter, setFilter] = useState<InventoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | undefined>(undefined);
  const [deleting, setDeleting] = useState<Ingredient | undefined>(undefined);

  useEffect(() => {
    if (canRead) {
      void loadUnits();
    }
  }, [canRead, loadUnits]);

  const ingredients = useMemo(
    () => ingredientsQuery.data ?? [],
    [ingredientsQuery.data]
  );
  const lowStockIngredients = useMemo(
    () => lowStockQuery.data ?? [],
    [lowStockQuery.data]
  );
  const overview = alertsQuery.data;
  const alertCounts = countAlertsByStatus(overview);
  const notification = latestNotification(overview);

  const lowStockState = lowStockQuery.isLoading
    ? "loading"
    : lowStockQuery.isError
      ? "error"
      : "ready";
  const lowStockIds = useMemo(() => lowStockIdSet(lowStockIngredients), [
    lowStockIngredients,
  ]);

  const baseRows =
    filter === "LOW" ? lowStockIngredients : ingredients;
  const visibleRows = useMemo(
    () => baseRows.filter((ingredient) => matchesSearch(ingredient, query)),
    [baseRows, query]
  );

  const listError =
    filter === "LOW" ? lowStockQuery.isError : ingredientsQuery.isError;
  const listLoading =
    filter === "LOW" ? lowStockQuery.isLoading : ingredientsQuery.isLoading;
  const refreshing =
    ingredientsQuery.isFetching ||
    lowStockQuery.isFetching ||
    alertsQuery.isFetching;

  const emptyLabel =
    filter === "LOW"
      ? query.trim()
        ? "No hay ingredientes con stock bajo que coincidan con la búsqueda"
        : "No hay ingredientes con stock bajo"
      : query.trim()
        ? "No hay ingredientes que coincidan con la búsqueda"
        : "Aún no hay ingredientes registrados";

  const footerHint = permissionDenied
    ? "Esta sección está disponible para administradores y chefs. Si necesitas consultar el inventario, solicita acceso a un administrador."
    : "El stock bajo se calcula cuando el stock actual es estrictamente menor al mínimo. Los correos de alerta se envían automáticamente; esta pantalla solo refleja el estado registrado.";

  const footerTips: FooterTip[] = canRead
    ? [
        {
          icon: Boxes,
          text: "Alterna entre «Todos» y «Stock bajo» para filtrar el inventario.",
        },
        {
          icon: Search,
          text: "Busca por nombre, unidad o abreviatura para encontrar un ingrediente.",
        },
        {
          icon: TriangleAlert,
          text: "Las filas resaltadas indican ingredientes por debajo del stock mínimo.",
        },
      ]
    : [
        {
          icon: Boxes,
          text: "El resumen superior muestra el total de ingredientes y alertas abiertas.",
        },
        {
          icon: TriangleAlert,
          text: "Las alertas de stock bajo se envían por correo de forma automática.",
        },
        {
          icon: Search,
          text: "Con acceso podrás buscar, filtrar y editar los ingredientes del inventario.",
        },
      ];

  function refreshAll() {
    void Promise.all([
      ingredientsQuery.refetch(),
      lowStockQuery.refetch(),
      alertsQuery.refetch(),
    ]);
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(ingredient: Ingredient) {
    setEditing(ingredient);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting?.id) return;

    try {
      await deleteIngredient.mutateAsync(deleting.id);
      setDeleting(undefined);
    } catch {
      toast.error("El servidor falló. No se pudo eliminar el ingrediente.");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <Boxes className="size-5 text-hub-electric-soft" />
          </span>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              Ingredientes
            </h1>
            <p className="text-muted-foreground">
              Inventario, stock mínimo y alertas por correo
            </p>
          </div>
        </div>

        {canRead && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              onClick={refreshAll}
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={cn(refreshing && "animate-spin")} />
              Actualizar
            </Button>
            <Button size="lg" onClick={openCreate} className="w-full sm:w-auto">
              <Plus />
              Nuevo ingrediente
            </Button>
          </div>
        )}
      </header>

      <div className="@container min-w-0 space-y-4">
        {!user && (
          <Card className="animate-pulse bg-card py-0 ring-1 ring-border">
            <CardContent className="space-y-4 p-5">
              <div className="h-5 w-44 rounded bg-muted" />
              <div className="grid gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 rounded-xl bg-muted"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {permissionDenied && (
          <Card className="bg-card py-0 ring-1 ring-border">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
                <AlertCircle className="size-6 text-hub-neon-red" />
              </span>
              <div>
                <p className="font-medium text-foreground">
                  No tienes permiso para ver los ingredientes
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esta sección está disponible para administradores y chefs.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {canRead && (
          <>
            <InventorySummary
              totalIngredients={
                ingredientsQuery.data ? ingredients.length : null
              }
              lowStockCount={
                lowStockQuery.data ? lowStockIngredients.length : null
              }
              openAlertsCount={overview ? alertCounts.open : null}
              latestNotification={notification}
              ingredientsLoading={ingredientsQuery.isLoading}
              lowStockLoading={lowStockQuery.isLoading}
              alertsLoading={alertsQuery.isLoading}
              ingredientsError={ingredientsQuery.isError}
              lowStockError={lowStockQuery.isError}
              alertsError={alertsQuery.isError}
            />

            <StockAlertPanel
              overview={overview}
              loading={alertsQuery.isLoading}
              error={alertsQuery.isError}
              refreshing={alertsQuery.isFetching}
              onRetry={() => {
                void alertsQuery.refetch();
              }}
            />

            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Filtrar inventario"
                  >
                    <Button
                      size="sm"
                      variant={filter === "ALL" ? "default" : "outline"}
                      aria-pressed={filter === "ALL"}
                      onClick={() => setFilter("ALL")}
                    >
                      <Boxes />
                      Todos
                      {ingredientsQuery.data && (
                        <span className="rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
                          {ingredients.length}
                        </span>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === "LOW" ? "default" : "outline"}
                      aria-pressed={filter === "LOW"}
                      onClick={() => setFilter("LOW")}
                      className={cn(
                        filter !== "LOW" &&
                          lowStockIngredients.length > 0 &&
                          "border-hub-neon-red/40 text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red"
                      )}
                    >
                      <TriangleAlert />
                      Stock bajo
                      {lowStockQuery.data && (
                        <span className="rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
                          {lowStockIngredients.length}
                        </span>
                      )}
                    </Button>
                  </div>

                  <div className="relative w-full lg:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar por nombre o unidad..."
                      aria-label="Buscar ingredientes"
                      className="pl-9"
                    />
                  </div>
                </div>

                {filter === "ALL" &&
                  lowStockQuery.isError &&
                  !ingredientsQuery.isError && (
                    <div
                      role="alert"
                      className="flex flex-col gap-2 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-hub-neon-red" />
                        <p className="text-muted-foreground">
                          No se pudo verificar el stock bajo. Los estados de
                          inventario aparecen sin verificar.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void lowStockQuery.refetch();
                        }}
                      >
                        <RefreshCw />
                        Reintentar
                      </Button>
                    </div>
                  )}

                {listError ? (
                  <div
                    role="alert"
                    className="flex flex-col items-center justify-center gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 py-12 text-center"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
                      <AlertCircle className="size-6 text-hub-neon-red" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {filter === "LOW"
                          ? "No se pudo consultar el stock bajo"
                          : "No se pudieron cargar los ingredientes"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        El servidor falló. Inténtalo de nuevo.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        void (filter === "LOW"
                          ? lowStockQuery.refetch()
                          : ingredientsQuery.refetch());
                      }}
                    >
                      <RefreshCw />
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <IngredientsTable
                    ingredients={visibleRows}
                    filter={filter}
                    lowStockIds={lowStockIds}
                    lowStockState={lowStockState}
                    loading={listLoading}
                    emptyLabel={emptyLabel}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Footer
        images={robotIngrediente}
        description="El inventario lista cada ingrediente con su unidad, stock actual y stock mínimo. El resumen superior concentra los totales y las alertas, y el envío de correos ocurre automáticamente cuando un ingrediente baja del mínimo."
        hint={footerHint}
        tips={footerTips}
      />

      <IngredientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ingredient={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="Eliminar ingrediente"
        description={
          deleting
            ? `Se eliminará "${deleting.name ?? "este ingrediente"}". Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        pending={deleteIngredient.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
