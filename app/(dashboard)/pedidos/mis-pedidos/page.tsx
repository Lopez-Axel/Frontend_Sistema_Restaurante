"use client";

import { OrdersTable } from "@/components/orders/orders-table";
import { useOrderStatusStream } from "@/lib/hooks/useOrderStatusStream";

export default function MisPedidosPage() {
  useOrderStatusStream();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-title text-2xl text-foreground">Mis pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos tomados por el usuario actual
        </p>
      </div>
      <OrdersTable variant="my" />
    </div>
  );
}