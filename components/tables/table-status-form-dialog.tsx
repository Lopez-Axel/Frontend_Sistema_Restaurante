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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateTableStatus,
  useUpdateTableStatus,
} from "@/lib/hooks/useTables";
import {
  TABLE_STATUS_NAMES,
  statusLabel,
  type TableStatusName,
} from "@/lib/utils/table-status";
import type { components } from "@/types/api";

type TableStatus = components["schemas"]["TableStatus"];

interface TableStatusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: TableStatus;
}

export function TableStatusFormDialog({
  open,
  onOpenChange,
  status,
}: TableStatusFormDialogProps) {
  const createStatus = useCreateTableStatus();
  const updateStatus = useUpdateTableStatus();
  const isEdit = !!status;

  const [name, setName] = useState<TableStatusName | undefined>(
    status?.name ?? undefined
  );
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName(status?.name ?? undefined);
  }

  function onSubmit() {
    if (!name) return;
    if (isEdit && status?.id) {
      updateStatus.mutate(
        { id: status.id, name },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createStatus.mutate(name, {
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  const pending = createStatus.isPending || updateStatus.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            {isEdit ? "Editar estado de mesa" : "Nuevo estado de mesa"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza el nombre del estado"
              : "Registra un nuevo estado para las mesas"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="table-status-name">Nombre</Label>
          <Select
            value={name ?? null}
            onValueChange={(value) =>
              setName((value as TableStatusName) ?? undefined)
            }
          >
            <SelectTrigger className="w-full" id="table-status-name">
              <SelectValue placeholder="Selecciona el estado">
                {(value: string | null) =>
                  value ? statusLabel(value) : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TABLE_STATUS_NAMES.map((statusName) => (
                <SelectItem key={statusName} value={statusName}>
                  {statusLabel(statusName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {name && (
            <p className="text-sm text-muted-foreground">
              Estado visible como{" "}
              <span className="font-medium">{statusLabel(name)}</span>
            </p>
          )}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!name || pending}>
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear estado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}