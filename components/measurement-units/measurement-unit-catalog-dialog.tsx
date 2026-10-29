"use client";

import { useMemo, useState } from "react";
import { Info, Search } from "lucide-react";
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
import { useMeasurementUnitsStore } from "@/lib/stores/measurement-units";
import type { MeasurementUnitImportResult } from "@/lib/stores/measurement-units";
import { getErrorMessage } from "@/lib/utils/errors";
import {
  CATALOG_MAGNITUDES,
  findDuplicateUnit,
  formatUnitEquivalence,
  isImportableCatalogUnit,
  matchesUnitSearch,
  MEASUREMENT_UNIT_CATALOG,
  unitTypeLabel,
  type MeasurementUnit,
  type MeasurementUnitCatalogEntry,
} from "@/lib/utils/measurement-units";
import { cn } from "cn";

interface MeasurementUnitCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasurementUnitCatalogDialog({
  open,
  onOpenChange,
}: MeasurementUnitCatalogDialogProps) {
  const units = useMeasurementUnitsStore((state) => state.units);
  const importUnits = useMeasurementUnitsStore((state) => state.importUnits);
  const isMutating = useMeasurementUnitsStore((state) => state.isMutating);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <MeasurementUnitCatalogBody
          units={units}
          importUnits={importUnits}
          isMutating={isMutating}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface MeasurementUnitCatalogBodyProps {
  units: MeasurementUnit[];
  importUnits: (
    entries: MeasurementUnitCatalogEntry[]
  ) => Promise<MeasurementUnitImportResult>;
  isMutating: boolean;
  onClose: () => void;
}

/**
 * El cuerpo vive dentro del diálogo, que se desmonta al cerrarse: por eso la
 * búsqueda y la selección empiezan vacías en cada apertura sin efectos.
 */
function MeasurementUnitCatalogBody({
  units,
  importUnits,
  isMutating,
  onClose,
}: MeasurementUnitCatalogBodyProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const groups = useMemo(
    () =>
      CATALOG_MAGNITUDES.map((type) => ({
        type,
        items: MEASUREMENT_UNIT_CATALOG.filter(
          (entry) =>
            entry.unitType === type && matchesUnitSearch(entry, query)
        ),
      })).filter((group) => group.items.length > 0),
    [query]
  );

  const selectableKeys = useMemo<string[]>(
    () =>
      MEASUREMENT_UNIT_CATALOG.filter(
        (entry) =>
          isImportableCatalogUnit(entry) && !findDuplicateUnit(entry, units)
      ).map((entry) => entry.key),
    [units]
  );

  const selectedImportable = selected.filter((key) =>
    selectableKeys.includes(key)
  );

  function toggle(key: string) {
    if (!selectableKeys.includes(key)) return;
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  function toggleGroup(
    items: (typeof MEASUREMENT_UNIT_CATALOG)[number][]
  ) {
    const keys: string[] = items
      .filter(
        (entry) =>
          isImportableCatalogUnit(entry) && !findDuplicateUnit(entry, units)
      )
      .map((entry) => entry.key);

    if (!keys.length) return;

    const allSelected = keys.every((key) => selected.includes(key));
    setSelected((current) =>
      allSelected
        ? current.filter((key) => !keys.includes(key))
        : Array.from(new Set([...current, ...keys]))
    );
  }

  async function handleImport() {
    if (!selectedImportable.length || isMutating) return;

    const entries = MEASUREMENT_UNIT_CATALOG.filter((entry) =>
      selectedImportable.includes(entry.key)
    );

    try {
      const result = await importUnits(entries);

      if (result.failed.length > 0) {
        toast.error(
          result.failed.length === 1
            ? "Una unidad no se pudo importar"
            : `${result.failed.length} unidades no se pudieron importar`,
          {
            description: result.failed
              .slice(0, 2)
              .map((item) => `${item.name}: ${item.message}`)
              .join(" · "),
          }
        );
      }

      if (result.created > 0) {
        toast.success(
          result.created === 1
            ? "Unidad importada"
            : `${result.created} unidades importadas`,
          {
            description:
              result.skipped > 0
                ? `${result.skipped} ya existían en el sistema`
                : undefined,
          }
        );
        setSelected([]);
        onClose();
        return;
      }

      if (result.failed.length === 0) {
        toast.info("Las unidades seleccionadas ya estaban registradas");
        setSelected([]);
        onClose();
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, "No se pudieron importar las unidades")
      );
    }
  }

  return (
    <>
      <DialogHeader>
          <DialogTitle className="font-title text-xl text-foreground">
            Catálogo inicial de unidades
          </DialogTitle>
          <DialogDescription>
            Selecciona las unidades que utiliza tu negocio. Las que ya existen
            se omiten automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar unidad o abreviatura"
              className="pl-9"
              aria-label="Buscar en el catálogo de unidades"
            />
          </div>

          <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-hub-electric-soft" />
            <p>
              El contrato actual del backend solo admite masa, volumen y conteo.
              Las unidades de longitud se muestran como referencia y no se
              pueden importar.
            </p>
          </div>
        </div>

        <div className="scrollbar-hub max-h-[52vh] space-y-5 overflow-y-auto pr-1">
          {groups.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron unidades en el catálogo.
            </p>
          )}

          {groups.map((group) => {
            const groupKeys = group.items
              .filter(
                (entry) =>
                  isImportableCatalogUnit(entry) &&
                  !findDuplicateUnit(entry, units)
              )
              .map((entry) => entry.key);
            const allSelected =
              groupKeys.length > 0 &&
              groupKeys.every((key) => selected.includes(key));

            return (
              <section key={group.type} aria-label={unitTypeLabel(group.type)}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-title text-lg font-semibold text-foreground">
                    {unitTypeLabel(group.type)}
                  </h3>
                  {groupKeys.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => toggleGroup(group.items)}
                    >
                      {allSelected ? "Quitar todas" : "Seleccionar todas"}
                    </Button>
                  )}
                </div>

                <div className="mt-2 space-y-2">
                  {group.items.map((entry) => {
                    const duplicate = findDuplicateUnit(entry, units);
                    const supported = isImportableCatalogUnit(entry);
                    const selectable = supported && !duplicate;
                    const checked = selected.includes(entry.key);

                    return (
                      <label
                        key={entry.key}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                          selectable
                            ? "cursor-pointer border-border hover:border-primary/50 hover:bg-muted/40"
                            : "cursor-not-allowed border-border/60 opacity-60"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                          checked={checked}
                          disabled={!selectable}
                          onChange={() => toggle(entry.key)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                              {entry.name}
                            </span>
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-foreground">
                              {entry.abbreviation}
                            </span>
                            {duplicate && (
                              <span className="text-xs text-muted-foreground">
                                Ya registrada
                              </span>
                            )}
                            {!supported && (
                              <span className="text-xs text-hub-neon-red">
                                No compatible
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {formatUnitEquivalence(entry)}
                          </span>
                          {!supported && "note" in entry && entry.note && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {entry.note}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <DialogFooter className="gap-2 max-sm:flex-col sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedImportable.length}{" "}
            {selectedImportable.length === 1
              ? "unidad seleccionada"
              : "unidades seleccionadas"}
            {selected.length > 0 && (
              <Button
                type="button"
                variant="link"
                size="xs"
                className="ml-2 h-auto p-0"
                onClick={() => setSelected([])}
              >
                Limpiar
              </Button>
            )}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!selectedImportable.length || isMutating}
              className="flex-1 sm:flex-none"
            >
              {isMutating
                ? "Importando..."
                : selectedImportable.length > 0
                  ? `Importar (${selectedImportable.length})`
                  : "Importar"}
            </Button>
          </div>
        </DialogFooter>
    </>
  );
}
