"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useCreateTable, useUpdateTable } from "@/lib/hooks/useTables";
import { tableFormSchema, type TableFormValues } from "@/lib/schemas/tables";
import type { components } from "@/types/api";

type RestaurantTableResponse = components["schemas"]["RestaurantTableResponse"];

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: RestaurantTableResponse;
}

export function TableFormDialog({
  open,
  onOpenChange,
  table,
}: TableFormDialogProps) {
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const isEdit = !!table;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (open) {
      reset({ number: table?.number ?? undefined, capacity: table?.capacity ?? undefined });
    }
  }, [open, table, reset]);

  function onSubmit(values: TableFormValues) {
    if (isEdit && table?.id) {
      updateTable.mutate(
        { id: table.id, body: values },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTable.mutate(values, {
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  const pending = createTable.isPending || updateTable.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            {isEdit ? "Editar mesa" : "Nueva mesa"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza el número y la capacidad de la mesa"
              : "Registra una nueva mesa en el restaurante"}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              type="number"
              inputMode="numeric"
              placeholder="1"
              aria-invalid={!!errors.number}
              {...register("number", { valueAsNumber: true })}
            />
            {errors.number && (
              <p className="text-sm text-destructive">{errors.number.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidad (asientos)</Label>
            <Input
              id="capacity"
              type="number"
              inputMode="numeric"
              placeholder="4"
              aria-invalid={!!errors.capacity}
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-sm text-destructive">{errors.capacity.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear mesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}