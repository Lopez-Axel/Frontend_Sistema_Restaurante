"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Info, Plus, RefreshCw, Search, TrendingUp } from "lucide-react";
import { DishCatalog } from "@/components/dishes/dish-catalog";
import { DishFormDialog } from "@/components/dishes/dish-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDishesList } from "@/lib/hooks/useDishes";
import { useAuthStore } from "@/lib/stores/auth";
import { useDishesUiStore } from "@/lib/stores/dishes";
import {
  countDishesByCategory,
  dishPermissions,
  filterDishesByCategory,
  matchesDishSearch,
  type Dish,
} from "@/lib/utils/dishes";
import { cn } from "cn";

export default function PlatosPage() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const permissions = dishPermissions(role);

  const search = useDishesUiStore((state) => state.search);
  const categoryId = useDishesUiStore((state) => state.categoryId);
  const analysisEnabled = useDishesUiStore((state) => state.analysisEnabled);
  const setSearch = useDishesUiStore((state) => state.setSearch);
  const setCategoryId = useDishesUiStore((state) => state.setCategoryId);
  const setAnalysisEnabled = useDishesUiStore(
    (state) => state.setAnalysisEnabled
  );

  const dishesQuery = useDishesList(analysisEnabled);
  const categoriesQuery = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);

  const dishes = useMemo(() => dishesQuery.data ?? [], [dishesQuery.data]);
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  );

  // El backend oculta la categoría a los mozos, así que el filtro por categoría
  // solo tiene sentido para los roles que la ven en el listado.
  const canFilterByCategory = role === "ADMIN" || role === "CHEF";

  const visibleDishes = useMemo(
    () =>
      filterDishesByCategory(
        dishes.filter((dish) => matchesDishSearch(dish, search)),
        canFilterByCategory ? categoryId : null
      ),
    [dishes, search, categoryId, canFilterByCategory]
  );

  const categoryCounts = useMemo(
    () => countDishesByCategory(dishes),
    [dishes]
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(dish: Dish) {
    setEditing(dish);
    setFormOpen(true);
  }

  function openDetail(dish: Dish) {
    if (!dish.id) return;
    router.push(`/platos/${dish.id}`);
  }

  const emptyLabel = search.trim()
    ? "No hay platos que coincidan con la búsqueda"
    : categoryId
      ? "No hay platos en esta categoría"
      : "Aún no hay platos en la carta";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <ChefHat className="size-5 text-hub-electric-soft" />
          </span>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              Platos
            </h1>
            <p className="text-muted-foreground">
              Catálogo de la carta: fotos, precios y recetas
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            onClick={() => void dishesQuery.refetch()}
            disabled={dishesQuery.isFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn(dishesQuery.isFetching && "animate-spin")} />
            Actualizar
          </Button>
          {permissions.canCreate && (
            <Button size="lg" onClick={openCreate} className="w-full sm:w-auto">
              <Plus />
              Nuevo plato
            </Button>
          )}
        </div>
      </header>

      <div className="@container min-w-0 space-y-4">
        <Card className="bg-card py-0 ring-1 ring-border">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {canFilterByCategory ? (
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Filtrar por categoría"
                >
                  <Button
                    size="sm"
                    variant={categoryId === null ? "default" : "outline"}
                    aria-pressed={categoryId === null}
                    onClick={() => setCategoryId(null)}
                  >
                    Todas
                    {dishesQuery.data && (
                      <span className="rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
                        {dishes.length}
                      </span>
                    )}
                  </Button>
                  {categories
                    .filter(
                      (category): category is typeof category & { id: string } =>
                        !!category.id
                    )
                    .map((category) => (
                      <Button
                        key={category.id}
                        size="sm"
                        variant={
                          categoryId === category.id ? "default" : "outline"
                        }
                        aria-pressed={categoryId === category.id}
                        onClick={() => setCategoryId(category.id)}
                      >
                        {category.name?.trim() || "Sin nombre"}
                        {categoryCounts.has(category.id) && (
                          <span className="rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
                            {categoryCounts.get(category.id)}
                          </span>
                        )}
                      </Button>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {dishesQuery.data
                    ? `${dishes.length} platos en la carta`
                    : "Cargando la carta..."}
                </p>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o descripción..."
                    aria-label="Buscar platos"
                    className="pl-9"
                  />
                </div>
                {permissions.canRequestAnalysisList && (
                  <Button
                    size="lg"
                    variant={analysisEnabled ? "default" : "outline"}
                    aria-pressed={analysisEnabled}
                    onClick={() => setAnalysisEnabled(!analysisEnabled)}
                    className="shrink-0"
                  >
                    <TrendingUp />
                    Análisis de costos
                  </Button>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <DishCatalog
                dishes={visibleDishes}
                loading={dishesQuery.isLoading}
                error={dishesQuery.isError}
                emptyLabel={emptyLabel}
                canEdit={permissions.canEdit}
                onOpen={openDetail}
                onEdit={openEdit}
                onRetry={() => void dishesQuery.refetch()}
              />
            </div>

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              El catálogo muestra todos los platos registrados, incluidos los
              que no están disponibles. Un plato dado de baja deja de ofrecerse
              en los pedidos, pero se sigue administrando desde la ficha de
              cada plato. Desplazá el carrusel para ver los demás platos.
            </p>
          </CardContent>
        </Card>
      </div>

      <DishFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        dish={editing}
        onSaved={() => void dishesQuery.refetch()}
      />
    </div>
  );
}
