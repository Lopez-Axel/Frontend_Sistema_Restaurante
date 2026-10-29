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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCreateCategory,
  useUpdateCategory,
  type CategoryDTO,
} from "@/lib/hooks/useCategories";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryDTO;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEdit = !!category;

  const [name, setName] = useState<string>(category?.name ?? "");
  const [available, setAvailable] = useState<boolean>(
    category?.available ?? true
  );
  const [wasOpen, setWasOpen] = useState(open);
  const [touched, setTouched] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(category?.name ?? "");
      setAvailable(category?.available ?? true);
      setTouched(false);
    }
  }

  const trimmed = name.trim();
  const invalid = !trimmed;

  function onSubmit() {
    setTouched(true);
    if (!trimmed) return;
    if (isEdit && category?.id) {
      updateCategory.mutate(
        { id: category.id, body: { name: trimmed, available } },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createCategory.mutate(
        { name: trimmed, available },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  }

  const pending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            {isEdit ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza la información de la categoría"
              : "Registra una categoría para agrupar platos"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej.: Entrantes, Postres..."
              aria-invalid={touched && invalid}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSubmit();
              }}
            />
            {touched && invalid && (
              <p className="text-sm text-destructive">El nombre es obligatorio</p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="category-available" className="text-sm font-medium">
                Disponibilidad
              </Label>
              <p className="text-xs text-muted-foreground">
                Determina si la categoría está disponible para su uso
              </p>
            </div>
            <Switch
              id="category-available"
              checked={available}
              onCheckedChange={(checked: boolean) => setAvailable(checked)}
            />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!trimmed || pending}>
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
