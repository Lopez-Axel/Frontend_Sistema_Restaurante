"use client";

import { useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusChip } from "@/components/tables/status-chip";
import { TableStatusFormDialog } from "@/components/tables/table-status-form-dialog";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import {
  useDeleteTableStatus,
  useTableStatuses,
} from "@/lib/hooks/useTables";
import { useAuthStore } from "@/lib/stores/auth";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { resolveTableStatus } from "@/lib/utils/table-status";
import { cn } from "cn";
import type { components } from "@/types/api";

type TableStatus = components["schemas"]["TableStatus"];

const PRESET_COLORS = [
  "#00e676",
  "#ff3b5c",
  "#4f3bff",
  "#0d00a4",
  "#22007c",
  "#a6aed6",
];

export default function EstadosMesaPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const statusesQuery = useTableStatuses();
  const deleteStatus = useDeleteTableStatus();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableStatus | undefined>(undefined);
  const [deleting, setDeleting] = useState<TableStatus | undefined>(undefined);

  const statuses = statusesQuery.data ?? [];

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(status: TableStatus) {
    setEditing(status);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-title text-3xl text-foreground">Estados de mesa</h1>
          <p className="text-muted-foreground">
            Catálogo de estados disponibles y color del tablero por estado
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={openCreate}>
            <Plus />
            Nuevo estado
          </Button>
        )}
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Estado</TableHead>
                <TableHead>Clave</TableHead>
                <TableHead>Color del tablero (personal)</TableHead>
                {isAdmin && <TableHead className="pr-4 text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-muted-foreground">
                    Cargando estados...
                  </TableCell>
                </TableRow>
              )}
              {!statusesQuery.isLoading && statuses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-muted-foreground">
                    No hay estados registrados.
                  </TableCell>
                </TableRow>
              )}
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="pl-4">
                    <StatusChip statusValue={status.name} statuses={statuses} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {status.name}
                  </TableCell>
                  <TableCell>
                    <StatusColorPicker status={status} statuses={statuses} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar estado"
                          onClick={() => openEdit(status)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar estado"
                          onClick={() => setDeleting(status)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        El color se guarda en este dispositivo y se aplica al tablero de mesas.
      </p>

      <TableStatusFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        status={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Eliminar estado de mesa"
        description={`Se eliminará el estado "${deleting?.name ?? ""}". No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        pending={deleteStatus.isPending}
        onConfirm={() => {
          if (!deleting?.id) return;
          deleteStatus.mutate(deleting.id, {
            onSuccess: () => setDeleting(undefined),
          });
        }}
      />
    </div>
  );
}

function StatusColorPicker({
  status,
  statuses,
}: {
  status: TableStatus;
  statuses: TableStatus[];
}) {
  const statusColors = usePreferencesStore((s) => s.statusColors);
  const setStatusColor = usePreferencesStore((s) => s.setStatusColor);
  const resetStatusColor = usePreferencesStore((s) => s.resetStatusColor);

  const ui = resolveTableStatus(status.name, statuses, statusColors);
  const isCustom = !!statusColors[status.name ?? ""];

  return (
    <div className="flex items-center gap-1.5">
      <label className="relative block cursor-pointer">
        <span
          className="block size-7 rounded-md border shadow-sm"
          style={{ backgroundColor: ui.color }}
          title={`Cambiar color de ${ui.label}`}
        />
        <input
          type="color"
          value={ui.color}
          onChange={(event) => setStatusColor(status.name ?? "", event.target.value)}
          aria-label={`Color de ${status.name ?? "estado"}`}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <div className="flex flex-wrap gap-1">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={`Usar ${preset}`}
            onClick={() => setStatusColor(status.name ?? "", preset)}
            className={cn(
              "size-4 rounded-full border transition-transform hover:scale-110",
              ui.color.toLowerCase() === preset.toLowerCase() && "ring-2 ring-ring ring-offset-1"
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>
      {isCustom && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Restablecer color por defecto"
          onClick={() => resetStatusColor(status.name ?? "")}
          className="size-7"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}