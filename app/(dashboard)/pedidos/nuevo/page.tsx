"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurantTables } from "@/lib/hooks/useTables";
import { useOrderCatalog } from "@/lib/hooks/useMenus";
import { useCreateOrder } from "@/lib/hooks/useOrders";
import { formatAmount } from "@/lib/utils/money";
import { cn } from "cn";
import type { components } from "@/types/api";

type OrderDetailCreateRequest = components["schemas"]["OrderDetailCreateRequest"];

function NuevoPedidoView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectTable = searchParams.get("table") ?? undefined;

  const tablesQuery = useRestaurantTables();
  const tables = tablesQuery.data ?? [];
  const { catalog, isLoading } = useOrderCatalog();
  const createOrder = useCreateOrder();

  const [tableId, setTableId] = useState<string | undefined>(preselectTable);
  const [lines, setLines] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  const dishes = catalog.filter((dish) => dish.available !== false);
  const total = useMemo(
    () =>
      catalog.reduce(
        (acc, dish) => acc + (lines[dish.id] ?? 0) * (dish.sellingPrice ?? 0),
        0
      ),
    [catalog, lines]
  );

  const updateQty = (dishId: string, delta: number) => {
    setLines((prev) => {
      const next = { ...prev };
      const quantity = (next[dishId] ?? 0) + delta;
      if (quantity <= 0) {
        delete next[dishId];
      } else {
        next[dishId] = quantity;
      }
      return next;
    });
  };

  const qtyFor = (dishId: string) => lines[dishId] ?? 0;

  const submit = () => {
    if (!tableId) {
      toast.error("Selecciona una mesa");
      return;
    }
    const details: OrderDetailCreateRequest[] = Object.entries(lines).map(
      ([dishId, quantity]) => ({ dishId, quantity })
    );
    if (details.length === 0) {
      toast.error("Agrega al menos un plato");
      return;
    }
    createOrder.mutate(
      { tableId, notes: notes.trim() || undefined, details },
      { onSuccess: () => router.push("/pedidos") }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href="/pedidos" />}
            aria-label="Volver a pedidos"
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="font-title text-2xl text-foreground">
              Nuevo pedido
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige la mesa y agrega platos del menú activo
            </p>
          </div>
        </div>
        <Button
          onClick={submit}
          disabled={createOrder.isPending}
          data-icon="inline-start"
        >
          <Plus />
          {createOrder.isPending ? "Creando..." : "Crear pedido"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="font-title text-lg text-foreground">
              Platos del menú
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando platos...</p>
            ) : dishes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay platos disponibles en el menú activo
              </p>
            ) : (
              <ul className="max-h-[60vh] divide-y overflow-auto">
                {dishes.map((dish) => {
                  const qty = qtyFor(dish.id);
                  return (
                    <li
                      key={dish.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{dish.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(dish.sellingPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Quitar ${dish.name}`}
                          disabled={qty === 0}
                          onClick={() => updateQty(dish.id, -1)}
                        >
                          <Minus />
                        </Button>
                        <span
                          className={cn(
                            "w-8 text-center text-sm font-medium tabular-nums",
                            qty === 0 && "text-muted-foreground"
                          )}
                          aria-live="polite"
                        >
                          {qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          aria-label={`Agregar ${dish.name}`}
                          onClick={() => updateQty(dish.id, 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-title text-lg text-foreground">
              Resumen del pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-table">Mesa</Label>
              <Select
                value={tableId ?? "ALL"}
                onValueChange={(value) =>
                  setTableId(value && value !== "ALL" ? value : undefined)
                }
              >
                <SelectTrigger className="w-full" id="order-table">
                  <SelectValue placeholder="Selecciona la mesa">
                    {(value: string | null) => {
                      const table = tables.find((t) => t.id === value);
                      return table ? `Mesa ${table.number}` : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Mesa {table.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-notes">Notas</Label>
              <Input
                id="order-notes"
                placeholder="Notas para la cocina (opcional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Platos</p>
              {Object.entries(lines).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguno por ahora
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {Object.entries(lines).map(([dishId, quantity]) => {
                    const dish = catalog.find((d) => d.id === dishId);
                    if (!dish) return null;
                    return (
                      <li
                        key={dishId}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {dish.name}{" "}
                          <span className="text-muted-foreground">
                            × {quantity}
                          </span>
                        </span>
                        <span className="tabular-nums">
                          {formatAmount(quantity * (dish.sellingPrice ?? 0))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <p className="font-title text-base text-foreground">Total</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {formatAmount(total)}
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={submit} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Creando..." : "Crear pedido"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NuevoPedidoPage() {
  return (
    <Suspense fallback={null}>
      <NuevoPedidoView />
    </Suspense>
  );
}