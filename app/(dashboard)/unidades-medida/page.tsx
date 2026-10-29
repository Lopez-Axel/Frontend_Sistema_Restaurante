"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  FlaskConical,
  Hash,
  LibraryBig,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Scale,
  Search,
  Trash2,
} from "lucide-react";
import robotMedida from "@/public/robot_medida.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mascot } from "@/components/brand/mascot";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import { MeasurementUnitCatalogDialog } from "@/components/measurement-units/measurement-unit-catalog-dialog";
import { MeasurementUnitFormDialog } from "@/components/measurement-units/measurement-unit-form-dialog";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/lib/stores/auth";
import { useMeasurementUnitsStore } from "@/lib/stores/measurement-units";
import { getErrorMessage } from "@/lib/utils/errors";
import {
  formatUnitEquivalence,
  magnitudeBadgeClass,
  matchesUnitSearch,
  UNIT_TYPE_LABELS,
  UNIT_TYPES,
  unitTypeLabel,
  type MeasurementUnit,
} from "@/lib/utils/measurement-units";
import { cn } from "cn";
import { toast } from "sonner";

const MASCOT_CLASS =
  "order-last mx-auto w-full max-w-56 sm:max-w-64 lg:order-first lg:mx-0 lg:w-56 lg:max-w-none xl:w-72";

function MagnitudeIcon({
  type,
  className,
}: {
  type: string | undefined;
  className?: string;
}) {
  if (type === "VOLUME") return <FlaskConical className={className} />;
  if (type === "COUNT") return <Hash className={className} />;
  if (type === "LENGTH") return <Ruler className={className} />;
  return <Scale className={className} />;
}

export default function UnidadesMedidaPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const canRead = user?.role === "ADMIN" || user?.role === "CHEF";
  const permissionDenied = !!user && !canRead;

  const units = useMeasurementUnitsStore((state) => state.units);
  const isLoading = useMeasurementUnitsStore((state) => state.isLoading);
  const isMutating = useMeasurementUnitsStore((state) => state.isMutating);
  const error = useMeasurementUnitsStore((state) => state.error);
  const lastLoadedAt = useMeasurementUnitsStore((state) => state.lastLoadedAt);
  const loadUnits = useMeasurementUnitsStore((state) => state.loadUnits);
  const deleteUnit = useMeasurementUnitsStore((state) => state.deleteUnit);

  const [query, setQuery] = useState("");
  const [magnitude, setMagnitude] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editing, setEditing] = useState<MeasurementUnit | undefined>(undefined);
  const [deleting, setDeleting] = useState<MeasurementUnit | undefined>(
    undefined
  );

  useEffect(() => {
    if (canRead) {
      void loadUnits();
    }
  }, [canRead, loadUnits]);

  const filteredUnits = useMemo(
    () =>
      units.filter(
        (unit) =>
          (magnitude === "ALL" || unit.unitType === magnitude) &&
          matchesUnitSearch(unit, query)
      ),
    [units, magnitude, query]
  );

  const hasLoadError =
    canRead &&
    !!error &&
    units.length === 0 &&
    lastLoadedAt === null &&
    !isLoading;
  const showSkeleton =
    !user ||
    (canRead &&
      units.length === 0 &&
      !hasLoadError &&
      (isLoading || lastLoadedAt === null));

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(unit: MeasurementUnit) {
    setEditing(unit);
    setFormOpen(true);
  }

  function clearFilters() {
    setQuery("");
    setMagnitude("ALL");
  }

  async function handleDelete() {
    if (!deleting?.id) return;

    try {
      await deleteUnit(deleting.id);
      toast.success("Unidad de medida eliminada");
      setDeleting(undefined);
    } catch (deleteError) {
      const message =
        deleteError instanceof ApiError && deleteError.status === 409
          ? "No se puede eliminar: la unidad está en uso por ingredientes u otros registros."
          : getErrorMessage(
              deleteError,
              "No se pudo eliminar la unidad de medida"
            );

      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <Ruler className="size-5 text-hub-electric-soft" />
          </span>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              Unidades de medida
            </h1>
            <p className="text-muted-foreground">
              Magnitudes, abreviaturas y equivalencias
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              onClick={() => setCatalogOpen(true)}
              disabled={isLoading || lastLoadedAt === null}
              className="w-full sm:w-auto"
            >
              <LibraryBig />
              Importar catálogo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={openCreate}
              disabled={isLoading || lastLoadedAt === null}
              className="w-full sm:w-auto"
            >
              <Plus />
              Agregar unidad
            </Button>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <Mascot src={robotMedida} className={MASCOT_CLASS} />

        <div className="@container min-w-0 flex-1">
          {permissionDenied && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
                  <AlertCircle className="size-6 text-hub-neon-red" />
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    No tienes permiso para ver las unidades de medida
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta sección está disponible para administradores y chefs.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!permissionDenied && hasLoadError && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
                  <AlertCircle className="size-6 text-hub-neon-red" />
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    No se pudieron cargar las unidades
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    void loadUnits();
                  }}
                >
                  <RefreshCw />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {!permissionDenied && showSkeleton && (
            <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="animate-pulse bg-card py-0 ring-1 ring-border"
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-muted" />
                      <div className="space-y-2">
                        <div className="h-5 w-32 rounded bg-muted" />
                        <div className="h-3 w-20 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-10 w-full rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!permissionDenied &&
            !hasLoadError &&
            !showSkeleton &&
            units.length === 0 && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                  <Boxes className="size-6 text-hub-electric-soft" />
                </span>
                <p className="mt-4 font-medium text-foreground">
                  No hay unidades de medida registradas
                </p>
                {isAdmin && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Importa el catálogo inicial o agrega una unidad
                    personalizada.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {!permissionDenied &&
            !hasLoadError &&
            !showSkeleton &&
            units.length > 0 && (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nombre o abreviatura"
                    className="pl-9"
                    aria-label="Buscar unidades de medida"
                  />
                </div>
                <Select
                  value={magnitude}
                  onValueChange={(value) => setMagnitude(value ?? "ALL")}
                >
                  <SelectTrigger
                    className="w-full sm:w-48"
                    aria-label="Filtrar por magnitud"
                  >
                    <SelectValue placeholder="Todas las magnitudes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las magnitudes</SelectItem>
                    {UNIT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {UNIT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredUnits.length === 0 && (
                <Card className="bg-card py-0 ring-1 ring-border">
                  <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                      <Search className="size-6 text-hub-electric-soft" />
                    </span>
                    <p className="mt-4 font-medium text-foreground">
                      No se encontraron unidades
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ajusta la búsqueda o el filtro por magnitud.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Limpiar filtros
                    </Button>
                  </CardContent>
                </Card>
              )}

              {filteredUnits.length > 0 && (
                <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
                  {filteredUnits.map((unit, index) => (
                    <Card
                      key={
                        unit.id ??
                        `${unit.name ?? "unidad"}-${unit.abbreviation ?? ""}-${index}`
                      }
                      className="flex flex-col bg-card py-0 ring-1 ring-border transition-colors hover:ring-primary/50"
                    >
                      <CardContent className="flex flex-1 flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                                magnitudeBadgeClass(unit.unitType)
                              )}
                            >
                              <MagnitudeIcon
                                type={unit.unitType}
                                className="size-5"
                              />
                            </span>
                            <div className="min-w-0">
                              <h2 className="truncate font-title text-xl font-semibold text-foreground">
                                {unit.name ?? "Sin nombre"}
                              </h2>
                              <p className="text-xs text-muted-foreground">
                                {unitTypeLabel(unit.unitType)}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-primary/30">
                            {unit.abbreviation ?? "—"}
                          </span>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                          {formatUnitEquivalence(unit)}
                        </div>

                        {isAdmin && (
                          <div className="mt-auto flex justify-end gap-1 pt-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Editar unidad de medida"
                              onClick={() => openEdit(unit)}
                              className="text-hub-electric-soft hover:bg-primary/15 hover:text-hub-electric-soft"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Eliminar unidad de medida"
                              onClick={() => setDeleting(unit)}
                              className="text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MeasurementUnitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        unit={editing}
      />

      <MeasurementUnitCatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Eliminar unidad de medida"
        description={`Se eliminará la unidad "${deleting?.name ?? ""}". No se puede deshacer. Si está en uso por ingredientes, el backend rechazará la operación.`}
        confirmLabel="Eliminar"
        destructive
        pending={isMutating}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}
