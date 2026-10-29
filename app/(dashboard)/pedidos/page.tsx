"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrdersTable } from "@/components/orders/orders-table";
import { useOrderStatusStream } from "@/lib/hooks/useOrderStatusStream";
import { useRestaurantTables } from "@/lib/hooks/useTables";

function PedidosView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId") ?? undefined;

  const tablesQuery = useRestaurantTables();
  const tables = tablesQuery.data ?? [];

  useOrderStatusStream();

  const onTableChange = (value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      next.set("tableId", value);
    } else {
      next.delete("tableId");
    }
    const query = next.toString();
    router.replace(query ? `/pedidos?${query}` : "/pedidos");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-title text-2xl text-foreground">
            Pedidos
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-hub-neon-green" />
            En vivo vía SSE
          </p>
        </div>
        <Button
          render={<Link href="/pedidos/nuevo" />}
          nativeButton={false}
          data-icon="inline-start"
        >
          <Plus />
          Nuevo pedido
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">Mesa</label>
        <Select
          value={tableId ?? "ALL"}
          onValueChange={(value) => onTableChange(value ?? null)}
        >
          <SelectTrigger className="w-56" aria-label="Filtrar por mesa">
            <SelectValue placeholder="Todas las mesas">
              {(value: string | null) => {
                if (value && value !== "ALL") {
                  const table = tables.find((t) => t.id === value);
                  if (table) return `Mesa ${table.number}`;
                }
                return null;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las mesas</SelectItem>
            {tables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                Mesa {table.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <OrdersTable tableId={tableId} />
    </div>
  );
}

export default function PedidosPage() {
  return (
    <Suspense fallback={null}>
      <PedidosView />
    </Suspense>
  );
}