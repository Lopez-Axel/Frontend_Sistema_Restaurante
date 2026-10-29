"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ChefHat,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import { DishAuditSection } from "@/components/dishes/dish-audit-section";
import { DishCostAnalysis } from "@/components/dishes/dish-cost-analysis";
import { DishFormDialog } from "@/components/dishes/dish-form-dialog";
import { DishImage } from "@/components/dishes/dish-image";
import { DishImageDialog } from "@/components/dishes/dish-image-dialog";
import { DishIngredientsPanel } from "@/components/dishes/dish-ingredients-panel";
import { DishSummaryCard } from "@/components/dishes/dish-summary-card";
import { useDeleteDish, useDish } from "@/lib/hooks/useDishes";
import { useAuthStore } from "@/lib/stores/auth";
import { getErrorMessage } from "@/lib/utils/errors";
import { formatAmount } from "@/lib/utils/money";
import {
  dishAvailabilityLabel,
  dishAvailabilityTone,
  dishPermissions,
} from "@/lib/utils/dishes";

export default function PlatoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const role = useAuthStore((state) => state.user?.role);
  const permissions = dishPermissions(role);

  const dishQuery = useDish(id);
  const deleteDish = useDeleteDish();

  const [editOpen, setEditOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dish = dishQuery.data;
  const name = dish?.name?.trim() || "Plato";

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteDish.mutateAsync(id);
      setDeleteOpen(false);
      router.push("/platos");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo eliminar el plato"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Volver al catálogo de platos"
            nativeButton={false}
            render={<Link href="/platos" />}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              {dishQuery.isLoading ? "Plato" : name}
            </h1>
            {dish && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge className={dishAvailabilityTone(dish.available !== false)}>
                  {dishAvailabilityLabel(dish.available !== false)}
                </Badge>
                {dish.categoryName && <Badge variant="outline">{dish.categoryName}</Badge>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canUploadImage && dish && (
            <Button variant="outline" size="sm" onClick={() => setImageOpen(true)}>
              <Camera />
              Cambiar foto
            </Button>
          )}
          {permissions.canEdit && dish && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Editar
            </Button>
          )}
          {permissions.canDelete && dish && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {dishQuery.isError ? (
        <Card className="bg-card py-0 ring-1 ring-border">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
              <ChefHat className="size-6 text-hub-neon-red" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                No se pudo cargar el plato
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                El servidor falló o el plato ya no existe.
              </p>
            </div>
            <Button variant="outline" onClick={() => void dishQuery.refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden bg-card py-0 ring-1 ring-border">
            <div className="relative aspect-video w-full bg-muted/30">
              <DishImage
                src={dish?.imageUrl}
                alt={name}
                sizes="100vw"
                priority
              />
            </div>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-title text-2xl text-foreground">{name}</h2>
                    <Badge className={dishAvailabilityTone(dish?.available !== false)}>
                      {dishAvailabilityLabel(dish?.available !== false)}
                    </Badge>
                    {dish?.categoryName && <Badge variant="outline">{dish?.categoryName}</Badge>}
                  </div>
                  {dish?.description && (
                    <p className="text-sm text-muted-foreground">{dish.description}</p>
                  )}
                </div>
                {dish?.sellingPrice !== null && dish?.sellingPrice !== undefined && (
                  <div className="text-right">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                      Precio de venta
                    </p>
                    <p className="font-title text-2xl text-hub-neon-green tabular-nums">
                      {formatAmount(dish.sellingPrice)}
                    </p>
                  </div>
                )}
              </div>
              {dish?.productionCost !== null && dish?.productionCost !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Costo de producción guardado:{" "}
                  <span className="tabular-nums">{formatAmount(dish.productionCost)}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {id && permissions.canManageIngredients && (
            <DishIngredientsPanel
              dishId={id}
              canManage={permissions.canManageIngredients}
            />
          )}

          {id && !permissions.canManageIngredients && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex items-start gap-3 p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-hub-electric-soft" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Receta y costos de producción
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    La composición del plato y el cálculo de costos son
                    visibles para el equipo de cocina y la administración.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.canViewCostAnalysis && id && (
            <>
              <DishSummaryCard dishId={id} />
              <DishCostAnalysis dishId={id} dish={dish} />
            </>
          )}

          <DishAuditSection
            createdAt={dish?.createdAt}
            updatedAt={dish?.updatedAt}
            createdBy={dish?.createdBy}
            updatedBy={dish?.updatedBy}
          />
        </div>
      )}

      <DishFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        dish={dish ?? null}
        onSaved={() => void dishQuery.refetch()}
      />

      <DishImageDialog
        open={imageOpen}
        onOpenChange={setImageOpen}
        dishId={id}
        dishName={name}
        currentImageUrl={dish?.imageUrl}
        onUploaded={() => void dishQuery.refetch()}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar plato"
        description={
          dish
            ? `Se eliminará "${name}" del catálogo. El plato deja de estar disponible pero conserva su información.`
            : ""
        }
        confirmLabel="Eliminar"
        destructive
        pending={deleteDish.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
