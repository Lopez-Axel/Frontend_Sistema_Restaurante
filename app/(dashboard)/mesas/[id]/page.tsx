"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, PlusCircle, Trash2, UserPlus } from "lucide-react";
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
import { StatusChip } from "@/components/tables/status-chip";
import { TableFormDialog } from "@/components/tables/table-form-dialog";
import { ChangeTableStatusDialog } from "@/components/tables/change-table-status-dialog";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import {
  useDeleteTable,
  useRestaurantTable,
  useTableHistory,
  useTableSeats,
  useTableStatuses,
  useUpdateSeat,
} from "@/lib/hooks/useTables";
import { useTableStatusStream } from "@/lib/hooks/useTableStatusStream";
import { useAuthStore } from "@/lib/stores/auth";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "cn";

export default function MesaDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const tableQuery = useRestaurantTable(id);
  const statusesQuery = useTableStatuses();
  const seatsQuery = useTableSeats(id);
  const historyQuery = useTableHistory(id);
  const deleteTable = useDeleteTable();
  const updateSeat = useUpdateSeat(id);

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useTableStatusStream();

  const table = tableQuery.data;
  const statuses = statusesQuery.data ?? [];
  const seats = seatsQuery.data ?? [];
  const history = historyQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Volver a mesas"
            nativeButton={false}
            render={<Link href="/mesas" />}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="font-subtitle text-3xl font-bold text-foreground">
              {table ? `Mesa ${table.number}` : "Mesa"}
            </h1>
            {table && (
              <p className="text-sm text-muted-foreground">
                {table.capacity} asientos
              </p>
            )}
          </div>
          {table && <StatusChip statusValue={table.status} statuses={statuses} />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/pedidos?tableId=${id}`} />}
          >
            <PlusCircle />
            Crear pedido
          </Button>
          <Button size="sm" onClick={() => setStatusOpen(true)} disabled={!table}>
            <UserPlus />
            Cambiar estado
          </Button>
          {isAdmin && table && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-subtitle text-sm uppercase tracking-widest text-muted-foreground">
              Asientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Marca una silla para alternar entre ocupada y libre.
            </p>
            {seatsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando asientos...</p>
            ) : seats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta mesa no tiene asientos registrados.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {seats.map((seat) => {
                  const occupied = !!seat.occupied;
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      aria-label={`Silla ${seat.number}${occupied ? " ocupada" : " libre"}`}
                      onClick={() =>
                        updateSeat.mutate({ seatId: seat.id ?? "", occupied: !occupied })
                      }
                      disabled={!seat.id || updateSeat.isPending}
                      title={occupied ? "Ocupada — tocar para liberar" : "Libre — tocar para ocupar"}
                      className={cn(
                        "inline-flex size-10 items-center justify-center rounded-lg border text-sm font-medium transition-transform hover:scale-105",
                        occupied
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
                      )}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-subtitle text-sm uppercase tracking-widest text-muted-foreground">
              Historial de estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando historial...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin cambios de estado registrados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry, index) => (
                    <TableRow key={`${entry.changedAt}-${index}`}>
                      <TableCell>
                        <StatusChip
                          statusValue={entry.statusName}
                          statuses={statuses}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(entry.changedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.changedByEmail ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {table && (
        <TableFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          table={table}
        />
      )}

      <ChangeTableStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        tableId={id}
        currentStatus={table?.status}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar mesa"
        description="Esta acción eliminará la mesa. No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        pending={deleteTable.isPending}
        onConfirm={() => {
          deleteTable.mutate(id, {
            onSuccess: () => {
              setDeleteOpen(false);
              router.push("/mesas");
            },
          });
        }}
      />
    </div>
  );
}