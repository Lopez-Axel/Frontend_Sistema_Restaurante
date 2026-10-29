"use client";

import { Eye, Pencil, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DishImage } from "@/components/dishes/dish-image";
import { formatAmount } from "@/lib/utils/money";
import {
  dishAvailabilityLabel,
  dishAvailabilityTone,
  dishStatusLabel,
  dishStatusTone,
  type Dish,
} from "@/lib/utils/dishes";
import { cn } from "cn";

interface DishCardProps {
  dish: Dish;
  canEdit?: boolean;
  onOpen?: (dish: Dish) => void;
  onEdit?: (dish: Dish) => void;
  className?: string;
}

/**
 * Tarjeta del catálogo de platos.
 *
 * La fotografía es la protagonista: ocupa la parte superior de la tarjeta y
 * conserva su proporción con `object-cover` (no se deforma). Sobre la imagen
 * solo va el indicador de disponibilidad; el nombre, la categoría y el precio
 * se muestran debajo.
 */
export function DishCard({
  dish,
  canEdit = false,
  onOpen,
  onEdit,
  className,
}: DishCardProps) {
  const name = dish.name?.trim() || "Plato sin nombre";
  const price = dish.sellingPrice;
  const category = dish.categoryName?.trim();
  const isAvailable = dish.available !== false;

  // El endpoint `?analysis=true` (solo ADMIN) agrega costo de producción,
  // precio sugerido y estado de precio. Si vienen, se muestran en la tarjeta.
  const hasAnalysis =
    dish.productionCost !== null &&
    dish.productionCost !== undefined &&
    dish.status !== null &&
    dish.status !== undefined;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden bg-card py-0 ring-1 ring-border transition-shadow hover:ring-primary/50",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onOpen?.(dish)}
        disabled={!onOpen}
        aria-label={`Ver detalle de ${name}`}
        className="relative block aspect-4/3 w-full overflow-hidden bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
      >
        <DishImage
          src={dish.imageUrl}
          alt={name}
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw"
        />
        <span
          className={cn(
            "absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm",
            dishAvailabilityTone(isAvailable)
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {dishAvailabilityLabel(isAvailable)}
        </span>
      </button>

      <CardContent className="flex-1 space-y-3 p-4">
        <h3
          className="font-title text-lg leading-snug text-foreground"
          title={name}
        >
          <span className="line-clamp-2">{name}</span>
        </h3>

        <div className="flex items-center justify-between gap-3">
          {category ? (
            <Badge variant="outline" className="w-fit gap-1">
              <Tag className="size-3" />
              {category}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Sin categoría</span>
          )}

          {price !== null && price !== undefined ? (
            <span className="font-title text-xl text-hub-neon-green tabular-nums">
              {formatAmount(price)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Sin precio</span>
          )}
        </div>

        {hasAnalysis && (
          <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Costo</span>
              <span className="font-medium tabular-nums text-foreground">
                {formatAmount(dish.productionCost)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Precio sugerido</span>
              <span className="font-medium tabular-nums text-foreground">
                {dish.suggestedSellingPrice !== null &&
                dish.suggestedSellingPrice !== undefined
                  ? formatAmount(dish.suggestedSellingPrice)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Estado</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  dishStatusTone(dish.status)
                )}
              >
                {dishStatusLabel(dish.status)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {onOpen && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpen(dish)}
              className="flex-1"
            >
              <Eye />
              Ver detalle
            </Button>
          )}
          {canEdit && onEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => onEdit(dish)}
              className="flex-1"
            >
              <Pencil />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
