"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ChangeOrderStatusDialog } from "@/components/orders/change-order-status-dialog";
import { AddDishDialog } from "@/components/orders/add-dish-dialog";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import {
  useDeleteOrder,
  useOrder,
  useOrderDetails,
  useUpdateOrderStatus,
} from "@/lib/hooks/useOrders";
import { useOrderStatusStream } from "@/lib/hooks/useOrderStatusStream";
import { useAuthStore } from "@/lib/stores/auth";
import { formatDateTime } from "@/lib/utils/dates";
import { formatAmount } from "@/lib/utils/money";
import { isOpenOrder } from "@/lib/utils/order-status";

export default function PedidoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const orderQuery = useOrder(id);
  const detailsQuery = useOrderDetails(id);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  useOrderStatusStream();

  const [statusOpen, setStatusOpen] = useState(false);
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const order = orderQuery.data;
  const details = detailsQuery.data ?? [];

  if (!order) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/pedidos" />} aria-label="Volver a pedidos">
          <ArrowLeft />
        </Button>
        {orderQuery.isLoading ? "Cargando pedido..." : "No se encontró el pedido"}
      </div>
    );
  }

  const subtotals = details.reduce(
    (acc, line) => acc + (line.subtotal ?? 0),
    0
  );
  const open = isOpenOrder(order.orderStatusName);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/pedidos" />} aria-label="Volver a pedidos">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="font-title text-2xl text-foreground">
              Pedido de Mesa {order.tableNumber ?? "—"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(order.dateTime)}
            </p>
          </div>
        </div>
        <OrderStatusBadge name={order.orderStatusName} colorHex={order.colorHex} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setStatusOpen(true)}
          disabled={updateStatus.isPending}
          data-icon="inline-start"
        >
          <Pencil />
          Cambiar estado
        </Button>
        <Button
          variant="outline"
          onClick={() => setAddDishOpen(true)}
          disabled={!open}
          data-icon="inline-start"
        >
          <PlusCircle />
          Agregar plato
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            data-icon="inline-start"
          >
            <Trash2 />
            Eliminar
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-title text-lg text-foreground">
              Detalles del pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Mesa</span>
              <span className="font-medium">
                {order.tableNumber ? `Mesa ${order.tableNumber}` : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Mozo</span>
              <span className="font-medium">{order.waiterName ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">{formatDateTime(order.dateTime)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Notas</span>
              <span className="max-w-[60%] truncate text-right font-medium">
                {order.notes || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <span className="text-muted-foreground">Pagos</span>
              <span className="text-sm text-muted-foreground">
                (se gestiona desde el módulo de pagos)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-title text-lg text-foreground">
              Líneas del pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {details.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {detailsQuery.isLoading
                  ? "Cargando líneas..."
                  : "No hay líneas en este pedido"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plato</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">P/U</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.dishName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {line.quantity ?? 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatAmount(line.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-title text-base text-foreground">
                      Total
                    </TableCell>
                    <TableCell className="text-right text-base font-semibold tabular-nums text-foreground">
                      {formatAmount(subtotals)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ChangeOrderStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        orderId={id}
        currentStatusName={order.orderStatusName}
      />

      <AddDishDialog open={addDishOpen} onOpenChange={setAddDishOpen} orderId={id} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar pedido"
        description="El pedido se eliminará de forma lógica. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        pending={deleteOrder.isPending}
        onConfirm={() =>
          deleteOrder.mutate(id, { onSuccess: () => router.push("/pedidos") })
        }
      />
    </div>
  );
}