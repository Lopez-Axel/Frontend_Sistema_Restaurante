"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type UseFormSetError,
} from "react-hook-form";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/http";
import type { MenuRequest, MenuResponse } from "@/lib/api/menus";
import {
  useCreateMenu,
  useUpdateMenu,
} from "@/lib/hooks/useMenus";
import { menuFormSchema, type MenuFormValues } from "@/lib/schemas/menus";
import { getErrorMessage } from "@/lib/utils/errors";

const FIELD_NAMES = ["name", "description"] as const;

function applyFieldErrors(
  error: unknown,
  setError: UseFormSetError<MenuFormValues>
): boolean {
  if (!(error instanceof ApiError) || !error.fieldErrors) return false;

  let applied = false;
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if ((FIELD_NAMES as readonly string[]).includes(field)) {
      setError(field as (typeof FIELD_NAMES)[number], {
        type: "server",
        message,
      });
      applied = true;
    }
  }
  return applied;
}

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: MenuResponse | null;
}

export function MenuFormDialog({
  open,
  onOpenChange,
  menu,
}: MenuFormDialogProps) {
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const isEdit = !!menu?.id;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
      description: "",
      active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: menu?.name ?? "",
      description: menu?.description ?? "",
      active: menu?.active ?? true,
    });
  }, [open, menu, reset]);

  async function onSubmit(values: MenuFormValues) {
    const body: MenuRequest = {
      name: values.name.trim(),
      description: values.description.trim(),
      active: values.active,
    };

    try {
      if (isEdit && menu?.id) {
        await updateMenu.mutateAsync({ menuId: menu.id, body });
      } else {
        await createMenu.mutateAsync(body);
      }
      onOpenChange(false);
    } catch (error) {
      if (!applyFieldErrors(error, setError)) {
        toast.error(getErrorMessage(error, "No se pudo guardar el menú"));
      }
    }
  }

  const pending = createMenu.isPending || updateMenu.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            {isEdit ? "Editar menú" : "Nuevo menú"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza el nombre, la descripción o el estado del menú"
              : "Agrupa platos de la carta en un menú"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="menu-name">Nombre</Label>
            <Input
              id="menu-name"
              placeholder="Ej.: Menú del día, Carta de verano..."
              maxLength={100}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-description">Descripción</Label>
            <Textarea
              id="menu-description"
              placeholder="Describe qué platos o propuesta incluye este menú"
              rows={4}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="menu-active" className="text-sm font-medium">
                Activo
              </Label>
              <p className="text-xs text-muted-foreground">
                Los menús inactivos no se muestran en el listado ni en la carta.
              </p>
            </div>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Switch
                  id="menu-active"
                  checked={field.value}
                  onCheckedChange={(checked: boolean) =>
                    field.onChange(checked)
                  }
                />
              )}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear menú"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
