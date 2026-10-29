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
import { useChangeTableStatus, useTableStatuses } from "@/lib/hooks/useTables";
import { resolveTableStatus } from "@/lib/utils/table-status";

interface ChangeTableStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  currentStatus?: string;
}

export function ChangeTableStatusDialog({
  open,
  onOpenChange,
  tableId,
  currentStatus,
}: ChangeTableStatusDialogProps) {
  const statusesQuery = useTableStatuses();
  const changeStatus = useChangeTableStatus();
  const statuses = statusesQuery.data ?? [];

  const currentId = statuses.find(
    (s) => s.id === currentStatus || s.name === currentStatus
  )?.id;

  const [pickedId, setPickedId] = useState<string | undefined>(undefined);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPickedId(undefined);
  }

  const selectedId = pickedId ?? currentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            Cambiar estado de la mesa
          </DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado y confirma el cambio
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="table-status">Estado</Label>
          <Select
            value={selectedId ?? null}
            onValueChange={(value) => setPickedId(value ?? undefined)}
          >
            <SelectTrigger className="w-full" id="table-status">
              <SelectValue placeholder="Selecciona un estado">
                {(value: string | null) => {
                  const match = statuses.find((s) => s.id === value);
                  return match
                    ? resolveTableStatus(match.name, statuses).label
                    : null;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id ?? ""}>
                  {resolveTableStatus(status.name, statuses).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!selectedId || changeStatus.isPending || statuses.length === 0}
            onClick={() => {
              if (!selectedId) return;
              changeStatus.mutate(
                { id: tableId, body: { statusId: selectedId } },
                { onSuccess: () => onOpenChange(false) }
              );
            }}
          >
            {changeStatus.isPending ? "Guardando..." : "Cambiar estado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}