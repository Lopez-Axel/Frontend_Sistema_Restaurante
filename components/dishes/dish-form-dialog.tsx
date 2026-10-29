"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type UseFormSetError,
} from "react-hook-form";
import {
  AlertCircle,
  Banknote,
  Camera,
  Info,
  Loader2,
  Soup,
  UtensilsCrossed,
} from "lucide-react";
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
import { StepperControls } from "@/components/ingredients/stepper-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DishAuditSection } from "@/components/dishes/dish-audit-section";
import { DishImagePicker } from "@/components/dishes/dish-image-picker";
import { ApiError } from "@/lib/api/http";
import type { DishRequest } from "@/lib/api/dishes";
import {
  buildDishFormSchema,
  parseMoneyField,
  type DishFormValues,
} from "@/lib/schemas/dishes";
import {
  useCreateDish,
  useUpdateDish,
  useUploadDishImage,
} from "@/lib/hooks/useDishes";
import { useCategories } from "@/lib/hooks/useCategories";
import { useAuthStore } from "@/lib/stores/auth";
import { saveDishWithImage } from "@/lib/utils/dish-workflow";
import { dishPermissions, type Dish } from "@/lib/utils/dishes";
import { clampStep, NUMBER_INPUT_CLASS } from "@/lib/utils/numeric";

const FIELD_NAMES = [
  "name",
  "description",
  "categoryId",
  "sellingPrice",
  "productionCost",
  "available",
] as const;


function applyFieldErrors(
  error: unknown,
  setError: UseFormSetError<DishFormValues>
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

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function moneyInputValue(value?: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

interface DishFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish?: Dish | null;
  onSaved?: (dish: Dish) => void;
}

/**
 * Formulario único de alta/edición de platos.
 *
 * El backend expone la imagen en `POST /dishes/{id}/image`, o sea que la
 * fotografía solo puede subirse cuando el plato ya tiene UUID definitivo. Por
 * eso el guardado se divide en dos operaciones coordinadas por
 * `saveDishWithImage`: si la subida falla, el plato NO se vuelve a crear y la
 * interfaz conserva el archivo para reintentar.
 *
 * El cuerpo del formulario vive en `DishFormBody`, que se monta con `key`
 * según el plato: así el estado (archivo, error, formulario) se reinicia al
 * cambiar de plato y al cerrar el diálogo, sin efectos que sincronicen estado.
 */
export function DishFormDialog({
  open,
  onOpenChange,
  dish,
  onSaved,
}: DishFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DishFormBody
          key={dish?.id ?? "new"}
          dish={dish ?? null}
          onSaved={onSaved}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface DishFormBodyProps {
  dish: Dish | null;
  onSaved?: (dish: Dish) => void;
  onClose: () => void;
}

function DishFormBody({ dish, onSaved, onClose }: DishFormBodyProps) {
  const role = useAuthStore((state) => state.user?.role);
  const permissions = dishPermissions(role);
  const categoriesQuery = useCategories();
  const createDish = useCreateDish();
  const updateDish = useUpdateDish();
  const uploadImage = useUploadDishImage();

  const isEdit = !!dish?.id;
  const canSetSellingPrice = permissions.canUpdateSellingPrice;
  // El backend solo devuelve y acepta el costo de producción para ADMIN.
  const canSetProductionCost = permissions.canViewCostAnalysis;

  const [file, setFile] = useState<File | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    dishId: string;
    dishName: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () => buildDishFormSchema({ canSetSellingPrice }),
    [canSetSellingPrice]
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<DishFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: dish?.name ?? "",
      description: dish?.description ?? "",
      categoryId: dish?.categoryId ?? "",
      sellingPrice: moneyInputValue(dish?.sellingPrice),
      productionCost: moneyInputValue(dish?.productionCost),
      available: dish?.available ?? canSetSellingPrice,
    },
  });

  const categoryId = useWatch({ control, name: "categoryId" });

  const categories = categoriesQuery.data ?? [];
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const selectedCategoryLabel = selectedCategory?.name?.trim();

  // En alta un CHEF no puede activar el plato: el backend descarta el precio
  // de venta para ese rol y un plato disponible exige precio.
  const availableLocked = !isEdit && !canSetSellingPrice;
  const pending =
    createDish.isPending || updateDish.isPending || uploadImage.isPending;

  async function submitImage(dishId: string, image: File) {
    return uploadImage.mutateAsync({ id: dishId, file: image });
  }

  async function onSubmit(values: DishFormValues) {
    setServerError(null);

    const body: DishRequest = {
      name: values.name.trim(),
      description: values.description.trim(),
      categoryId: values.categoryId,
      available: availableLocked ? false : values.available,
    };

    if (canSetSellingPrice) {
      const sellingPrice = parseMoneyField(values.sellingPrice);
      if (sellingPrice !== undefined) body.sellingPrice = sellingPrice;
    }

    if (canSetProductionCost) {
      const productionCost = parseMoneyField(values.productionCost);
      if (productionCost !== undefined) body.productionCost = productionCost;
    }

    try {
      const outcome = await saveDishWithImage(
        {
          create: (payload) => createDish.mutateAsync(payload),
          update: (id, payload) => updateDish.mutateAsync({ id, body: payload }),
          uploadImage: submitImage,
        },
        { id: dish?.id, body, file }
      );

      if (outcome.status === "saved") {
        onSaved?.(outcome.dish);
        onClose();
        return;
      }

      // El plato quedó guardado; solo falló la foto. Se conserva el archivo y
      // el UUID para reintentar sin duplicar el plato.
      setPendingUpload({
        dishId: outcome.dish.id ?? (dish?.id ?? ""),
        dishName: outcome.dish.name ?? body.name,
      });
      setUploadError(
        errorMessage(outcome.imageError, "No se pudo subir la imagen del plato")
      );
      toast.error("El plato se guardó, pero la imagen quedó pendiente");
    } catch (error) {
      if (!applyFieldErrors(error, setError)) {
        setServerError(
          errorMessage(error, "No se pudo guardar el plato. Inténtalo de nuevo.")
        );
      }
    }
  }

  function applyMoneyStep(
    name: "sellingPrice" | "productionCost",
    direction: 1 | -1,
    step: number
  ) {
    if (name === "sellingPrice" && !canSetSellingPrice) return;
    if (name === "productionCost" && !canSetProductionCost) return;

    const raw = getValues(name);
    const parsed = raw?.trim() ? Number(raw) : Number.NaN;
    const next = clampStep(
      Number.isFinite(parsed) ? parsed : null,
      direction,
      step,
      0,
      99999999.99
    );
    setValue(name, moneyInputValue(next), { shouldDirty: true });
  }

  async function retryImageUpload() {
    if (!pendingUpload?.dishId || !file) return;
    setUploadError(null);

    try {
      const updated = await submitImage(pendingUpload.dishId, file);
      onSaved?.(updated.id ? updated : { ...updated, id: pendingUpload.dishId });
      setPendingUpload(null);
      setFile(null);
      onClose();
    } catch (error) {
      setUploadError(
        errorMessage(error, "No se pudo subir la imagen del plato")
      );
    }
  }

  const showImageSection = permissions.canUploadImage;
  const showCostFields = canSetProductionCost;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-title flex items-center gap-2 text-xl text-foreground">
          <Soup className="size-5 shrink-0 text-hub-electric-soft" aria-hidden="true" />
          {isEdit ? "Editar plato" : "Nuevo plato"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Actualiza los datos del plato, su foto y sus precios"
            : "Registra un plato con su categoría, foto y precio de venta"}
        </DialogDescription>
      </DialogHeader>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {pendingUpload && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                «{pendingUpload.dishName}» ya está guardado
              </p>
              <p>
                La imagen es una operación aparte y falló. Podés reintentarla sin
                volver a crear el plato; si cerrás ahora, la imagen queda
                pendiente y la podrás subir editando el plato.
              </p>
            </div>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-hub-neon-red/30 bg-hub-neon-red/10 p-3"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-hub-neon-red" />
            <p className="text-sm text-muted-foreground">{serverError}</p>
          </div>
        )}

        <fieldset
          disabled={!!pendingUpload}
          className="space-y-4 disabled:opacity-70"
        >
          <legend className="font-title text-sm font-semibold tracking-wide text-foreground uppercase">
            <span className="flex items-center gap-2">
              <UtensilsCrossed
                className="size-4 shrink-0 text-hub-electric-soft"
                aria-hidden="true"
              />
              Información general
            </span>
          </legend>

          <div className="space-y-2">
            <Label htmlFor="dish-name">Nombre</Label>
            <Input
              id="dish-name"
              placeholder="Ej.: Sopa de maní"
              maxLength={120}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dish-description">Descripción</Label>
            <Textarea
              id="dish-description"
              rows={3}
              placeholder="Describe el plato para el personal y la carta"
              maxLength={500}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dish-category">Categoría</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    id="dish-category"
                    className="w-full"
                    aria-invalid={!!errors.categoryId}
                    disabled={categoriesQuery.isLoading}
                  >
                    <SelectValue
                      placeholder={
                        categoriesQuery.isLoading
                          ? "Cargando categorías..."
                          : "Selecciona una categoría"
                      }
                    >
                      {selectedCategoryLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(
                        (category): category is typeof category & {
                          id: string;
                        } => !!category.id
                      )
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name?.trim() || "Sin nombre"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <p className="text-sm text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>
        </fieldset>

        {showImageSection && (
          <fieldset className="space-y-3">
            <legend className="font-title text-sm font-semibold tracking-wide text-foreground uppercase">
              <span className="flex items-center gap-2">
                <Camera
                  className="size-4 shrink-0 text-hub-electric-soft"
                  aria-hidden="true"
                />
                Imagen del plato
              </span>
            </legend>
            <DishImagePicker
              file={file}
              onFileChange={setFile}
              currentImageUrl={dish?.imageUrl}
              uploading={uploadImage.isPending}
              error={uploadError}
            />
            <p className="text-xs text-muted-foreground">
              La foto se sube una vez guardado el plato, porque el servidor la
              asocia al identificador definitivo.
            </p>
          </fieldset>
        )}

        <fieldset
          disabled={!!pendingUpload}
          className="space-y-4 disabled:opacity-70"
        >
          <legend className="font-title text-sm font-semibold tracking-wide text-foreground uppercase">
            <span className="flex items-center gap-2">
              <Banknote
                className="size-4 shrink-0 text-hub-electric-soft"
                aria-hidden="true"
              />
              Precio y disponibilidad
            </span>
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dish-selling-price">Precio de venta (BOB)</Label>
              <div className="relative">
                <Input
                  id="dish-selling-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  placeholder="0.00"
                  aria-invalid={!!errors.sellingPrice}
                  disabled={!canSetSellingPrice}
                  className={NUMBER_INPUT_CLASS}
                  {...register("sellingPrice")}
                />
                <StepperControls
                  incrementLabel="Aumentar precio de venta"
                  decrementLabel="Disminuir precio de venta"
                  onIncrement={() => applyMoneyStep("sellingPrice", 1, 0.01)}
                  onDecrement={() => applyMoneyStep("sellingPrice", -1, 0.01)}
                  disabled={!canSetSellingPrice || pending}
                />
              </div>
              {errors.sellingPrice && (
                <p className="text-sm text-destructive">
                  {errors.sellingPrice.message}
                </p>
              )}
              {!canSetSellingPrice && (
                <p className="text-xs text-muted-foreground">
                  Solo un administrador puede asignar el precio de venta.
                </p>
              )}
            </div>

            {showCostFields && (
              <div className="space-y-2">
                <Label htmlFor="dish-production-cost">
                  Costo de producción (BOB)
                </Label>
                <div className="relative">
                  <Input
                    id="dish-production-cost"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    placeholder="0.00"
                    aria-invalid={!!errors.productionCost}
                    className={NUMBER_INPUT_CLASS}
                    {...register("productionCost")}
                  />
                  <StepperControls
                    incrementLabel="Aumentar costo de producción"
                    decrementLabel="Disminuir costo de producción"
                    onIncrement={() => applyMoneyStep("productionCost", 1, 0.01)}
                    onDecrement={() => applyMoneyStep("productionCost", -1, 0.01)}
                    disabled={!canSetProductionCost || pending}
                  />
                </div>
                {errors.productionCost && (
                  <p className="text-sm text-destructive">
                    {errors.productionCost.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Costo manual del plato. Si lo dejás vacío se conserva el valor
                  guardado.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label htmlFor="dish-available">Disponible en la carta</Label>
              <p className="text-xs text-muted-foreground">
                {availableLocked
                  ? "El precio de venta lo asigna un administrador, por eso el plato se guarda como no disponible."
                  : "Un plato disponible necesita precio de venta y aparece en el catálogo."}
              </p>
              {errors.available && (
                <p className="text-sm text-destructive">
                  {errors.available.message}
                </p>
              )}
            </div>
            <Controller
              control={control}
              name="available"
              render={({ field }) => (
                <Switch
                  id="dish-available"
                  checked={field.value}
                  onCheckedChange={(checked: boolean) => field.onChange(checked)}
                  disabled={availableLocked}
                />
              )}
            />
          </div>

          {showCostFields && (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-hub-electric-soft" />
              <p className="text-xs text-muted-foreground">
                El costo también puede calcularse a partir de los ingredientes del
                plato, en la sección «Ingredientes y costos» de la ficha del
                plato. Son dos operaciones independientes: el valor guardado se
                reemplaza solo cuando recalculás.
              </p>
            </div>
          )}
        </fieldset>

        {isEdit && (
          <DishAuditSection
            createdAt={dish?.createdAt}
            updatedAt={dish?.updatedAt}
            createdBy={dish?.createdBy}
            updatedBy={dish?.updatedBy}
          />
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            {pendingUpload ? "Cerrar" : "Cancelar"}
          </Button>
          {pendingUpload ? (
            <Button
              type="button"
              onClick={retryImageUpload}
              disabled={pending || !file}
            >
              {uploadImage.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Reintentar imagen"
              )}
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear plato"}
            </Button>
          )}
        </DialogFooter>
      </form>
    </>
  );
}
