"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrderCatalog } from "@/lib/hooks/useMenus";
import { useAddOrderDetail } from "@/lib/hooks/useOrders";
import { formatAmount } from "@/lib/utils/money";

interface AddDishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function AddDishDialog({ open, onOpenChange, orderId }: AddDishDialogProps) {
  const { catalog, isLoading } = useOrderCatalog();
  const addDetail = useAddOrderDetail(orderId);

  const [dishId, setDishId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDishId(null);
      setQuantity(1);
    }
  }

  const availableDishes = catalog.filter((dish) => dish.available !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            Agregar plato al pedido
          </DialogTitle>
          <DialogDescription>
            Añade una línea adicional al pedido abierto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-dish">Plato</Label>
            <Select
              value={dishId}
              onValueChange={(value) => setDishId(value ?? null)}
            >
              <SelectTrigger className="w-full" id="add-dish">
                <SelectValue placeholder={isLoading ? "Cargando platos..." : "Selecciona un plato"}>
                  {(value: string | null) => {
                    const dish = availableDishes.find((d) => d.id === value);
                    if (!dish) return null;
                    return `${dish.name} · ${formatAmount(dish.sellingPrice)}`;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Cargando platos...
                  </SelectItem>
                ) : availableDishes.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    No hay platos disponibles
                  </SelectItem>
                ) : (
                  availableDishes.map((dish) => (
                    <SelectItem key={dish.id} value={dish.id}>
                      {dish.name} · {formatAmount(dish.sellingPrice)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-dish-qty">Cantidad</Label>
            <Input
              id="add-dish-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(1, Number(event.target.value) || 1))
              }
            />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!dishId || addDetail.isPending}
            onClick={() => {
              if (!dishId) return;
              addDetail.mutate(
                { dishId, quantity },
                { onSuccess: () => onOpenChange(false) }
              );
            }}
          >
            {addDetail.isPending ? "Guardando..." : "Agregar plato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}