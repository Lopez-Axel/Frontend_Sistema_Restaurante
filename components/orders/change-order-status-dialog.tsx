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
import { useUpdateOrderStatus } from "@/lib/hooks/useOrders";
import {
  ORDER_STATUS_NAMES,
  orderStatusLabel,
  resolveOrderStatus,
  type OrderStatusName,
} from "@/lib/utils/order-status";

interface ChangeOrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentStatusName?: string;
}

export function ChangeOrderStatusDialog({
  open,
  onOpenChange,
  orderId,
  currentStatusName,
}: ChangeOrderStatusDialogProps) {
  const updateStatus = useUpdateOrderStatus();
  const [picked, setPicked] = useState<OrderStatusName | undefined>(undefined);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPicked(undefined);
  }

  const options = ORDER_STATUS_NAMES.filter(
    (name) => name !== "CLOSED" && name !== currentStatusName
  ) as OrderStatusName[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            Cambiar estado del pedido
          </DialogTitle>
          <DialogDescription>
            El estado actual es{" "}
            <strong>{orderStatusLabel(currentStatusName)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {options.map((name) => {
            const ui = resolveOrderStatus(name);
            const active = picked === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setPicked(name)}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-ring focus:border-ring focus:outline-none"
                style={
                  active
                    ? { backgroundColor: ui.color, color: ui.text, borderColor: ui.color }
                    : undefined
                }
              >
                <span>{ui.label}</span>
                <span
                  className="inline-flex size-3 rounded-full"
                  style={{ backgroundColor: ui.color }}
                />
              </button>
            );
          })}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!picked || updateStatus.isPending}
            onClick={() => {
              if (!picked) return;
              updateStatus.mutate(
                { id: orderId, statusName: picked },
                { onSuccess: () => onOpenChange(false) }
              );
            }}
          >
            {updateStatus.isPending ? "Guardando..." : "Cambiar estado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}