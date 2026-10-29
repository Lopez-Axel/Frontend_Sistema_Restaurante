"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddMenuDish, useDishes } from "@/lib/hooks/useMenus";
import { formatAmount } from "@/lib/utils/money";

interface AddMenuDishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  existingDishIds: string[];
}

export function AddMenuDishDialog({
  open,
  onOpenChange,
  menuId,
  existingDishIds,
}: AddMenuDishDialogProps) {
  const dishesQuery = useDishes();
  const addDish = useAddMenuDish();
  const [dishId, setDishId] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDishId(null);
  }

  const dishes = (dishesQuery.data ?? []).filter(
    (dish) =>
      !!dish.id &&
      !existingDishIds.includes(dish.id) &&
      dish.available !== false
  );

  const noneLeft =
    !dishesQuery.isLoading && (dishesQuery.data ?? []).length > 0 && dishes.length === 0;
  const noDishes =
    !dishesQuery.isLoading && (dishesQuery.data ?? []).length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            Agregar plato al menú
          </DialogTitle>
          <DialogDescription>
            Selecciona un plato disponible que aún no forme parte de este menú
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(noDishes || noneLeft) && (
            <div className="flex items-start gap-3 rounded-lg border border-hub-line bg-hub-prussian/40 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-hub-electric-soft" />
              <p className="text-sm text-muted-foreground">
                {noDishes ? (
                  <>
                    No hay platos registrados.{" "}
                    <Link
                      href="/platos"
                      className="font-medium text-hub-electric-soft hover:underline"
                    >
                      Crea un plato
                    </Link>{" "}
                    antes de agregarlo al menú.
                  </>
                ) : (
                  "No quedan platos por agregar: ya forman parte del menú o no están disponibles."
                )}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="menu-add-dish">Plato</Label>
            <Select
              value={dishId}
              onValueChange={(value) => setDishId(value ?? null)}
            >
              <SelectTrigger
                className="w-full"
                id="menu-add-dish"
                disabled={dishesQuery.isLoading || dishes.length === 0}
              >
                <SelectValue
                  placeholder={
                    dishesQuery.isLoading
                      ? "Cargando platos..."
                      : "Selecciona un plato"
                  }
                >
                  {(value: string | null) => {
                    const dish = dishes.find((d) => d.id === value);
                    if (!dish) return null;
                    return `${dish.name?.trim() || "Plato sin nombre"} · ${formatAmount(dish.sellingPrice)}`;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {dishesQuery.isLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Cargando platos...
                  </SelectItem>
                ) : dishes.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    No hay platos para agregar
                  </SelectItem>
                ) : (
                  dishes
                    .filter(
                      (dish): dish is typeof dish & { id: string } => !!dish.id
                    )
                    .map((dish) => (
                      <SelectItem key={dish.id} value={dish.id}>
                        {dish.name?.trim() || "Plato sin nombre"} ·{" "}
                        {formatAmount(dish.sellingPrice)}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!dishId || addDish.isPending}
            onClick={() => {
              if (!dishId) return;
              addDish.mutate(
                { menuId, body: { dishId } },
                { onSuccess: () => onOpenChange(false) }
              );
            }}
          >
            {addDish.isPending ? "Agregando..." : "Agregar plato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
