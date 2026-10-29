"use client";

import { AlertCircle, ChefHat, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DishCard } from "@/components/dishes/dish-card";
import type { Dish } from "@/lib/utils/dishes";
import { cn } from "cn";

interface DishCatalogProps {
  dishes: Dish[];
  loading?: boolean;
  error?: boolean;
  emptyLabel?: string;
  canEdit?: boolean;
  onOpen?: (dish: Dish) => void;
  onEdit?: (dish: Dish) => void;
  onRetry?: () => void;
}

/**
 * Ancho de cada tarjeta del carrusel.
 *
 * En escritorio se ven tres tarjetas completas: el ancho descuenta la
 * separación (`gap-4` = 1rem) para que las tres ocupen exactamente el ancho
 * disponible. Los demás platos se alcanzan desplazando el carrusel.
 */
const CARD_WIDTH_CLASS =
  "w-[85%] shrink-0 snap-start sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_2rem)/3)]";

function DishCardSkeleton() {
  return (
    <Card
      className={cn(
        "animate-pulse gap-0 overflow-hidden bg-card py-0 ring-1 ring-border",
        CARD_WIDTH_CLASS
      )}
    >
      <div className="aspect-4/3 w-full bg-muted" />
      <CardContent className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-6 w-full rounded bg-muted" />
        <div className="h-8 w-2/3 rounded-lg bg-muted" />
      </CardContent>
    </Card>
  );
}

export function DishCatalog({
  dishes,
  loading = false,
  error = false,
  emptyLabel = "No hay platos que coincidan con los filtros",
  canEdit = false,
  onOpen,
  onEdit,
  onRetry,
}: DishCatalogProps) {
  if (loading) {
    return (
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scrollbar-hub">
        {Array.from({ length: 3 }).map((_, index) => (
          <DishCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-card py-0 ring-1 ring-border">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
            <AlertCircle className="size-6 text-hub-neon-red" />
          </span>
          <div>
            <p className="font-medium text-foreground">
              No se pudo cargar el catálogo de platos
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              El servidor falló. Inténtalo de nuevo.
            </p>
          </div>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw />
              Reintentar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (dishes.length === 0) {
    return (
      <Card className="bg-card py-0 ring-1 ring-border">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
            <ChefHat className="size-6 text-hub-electric-soft" />
          </span>
          <p className="font-medium text-foreground">{emptyLabel}</p>
          <p className="text-sm text-muted-foreground">
            El catálogo muestra todos los platos registrados, incluidos los que
            no están disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scrollbar-hub">
      {dishes.map((dish, index) => (
        <DishCard
          key={dish.id ?? `${dish.name ?? "plato"}-${index}`}
          dish={dish}
          canEdit={canEdit}
          onOpen={onOpen}
          onEdit={onEdit}
          className={CARD_WIDTH_CLASS}
        />
      ))}
    </div>
  );
}
