"use client";

import { create } from "zustand";
import { ApiError } from "@/lib/api/http";
import { measurementUnitsApi } from "@/lib/api/measurement-units";
import { getErrorMessage } from "@/lib/utils/errors";
import {
  findDuplicateUnit,
  isImportableCatalogUnit,
  sortMeasurementUnits,
  toMeasurementUnitRequest,
  type MeasurementUnit,
  type MeasurementUnitCatalogEntry,
  type MeasurementUnitRequest,
} from "@/lib/utils/measurement-units";

export interface MeasurementUnitImportResult {
  created: number;
  skipped: number;
  failed: { name: string; message: string }[];
}

interface MeasurementUnitsState {
  units: MeasurementUnit[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadUnits: () => Promise<void>;
  getUnitById: (id: string) => MeasurementUnit | undefined;
  createUnit: (body: MeasurementUnitRequest) => Promise<MeasurementUnit>;
  updateUnit: (
    id: string,
    body: MeasurementUnitRequest
  ) => Promise<MeasurementUnit>;
  deleteUnit: (id: string) => Promise<void>;
  importUnits: (
    entries: MeasurementUnitCatalogEntry[]
  ) => Promise<MeasurementUnitImportResult>;
  clearError: () => void;
}

function isDuplicateResponse(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 409) return true;
  return /ya existe|existente|duplicad/i.test(error.message);
}

export const useMeasurementUnitsStore = create<MeasurementUnitsState>()(
  (set, get) => ({
    units: [],
    isLoading: false,
    isMutating: false,
    error: null,
    lastLoadedAt: null,

    loadUnits: async () => {
      if (get().isLoading) return;

      set({ isLoading: true, error: null });
      try {
        const units = await measurementUnitsApi.list();
        set({
          units: sortMeasurementUnits(units),
          isLoading: false,
          lastLoadedAt: Date.now(),
        });
      } catch (error) {
        set({
          isLoading: false,
          error: getErrorMessage(
            error,
            "No se pudieron cargar las unidades de medida"
          ),
        });
      }
    },

    getUnitById: (id) => get().units.find((unit) => unit.id === id),

    createUnit: async (body) => {
      set({ isMutating: true, error: null });
      try {
        const created = await measurementUnitsApi.create(body);
        set((state) => ({
          units: sortMeasurementUnits([...state.units, created]),
          isMutating: false,
        }));
        return created;
      } catch (error) {
        set({
          isMutating: false,
          error: getErrorMessage(error, "No se pudo crear la unidad de medida"),
        });
        throw error;
      }
    },

    updateUnit: async (id, body) => {
      set({ isMutating: true, error: null });
      try {
        const response = await measurementUnitsApi.update(id, body);
        const updated = response.id ? response : { ...response, id };
        set((state) => ({
          units: sortMeasurementUnits(
            state.units.map((unit) => (unit.id === id ? updated : unit))
          ),
          isMutating: false,
        }));
        return updated;
      } catch (error) {
        set({
          isMutating: false,
          error: getErrorMessage(
            error,
            "No se pudo actualizar la unidad de medida"
          ),
        });
        throw error;
      }
    },

    deleteUnit: async (id) => {
      set({ isMutating: true, error: null });
      try {
        await measurementUnitsApi.remove(id);
        set((state) => ({
          units: state.units.filter((unit) => unit.id !== id),
          isMutating: false,
        }));
      } catch (error) {
        set({
          isMutating: false,
          error: getErrorMessage(
            error,
            "No se pudo eliminar la unidad de medida"
          ),
        });
        throw error;
      }
    },

    importUnits: async (entries) => {
      const result: MeasurementUnitImportResult = {
        created: 0,
        skipped: 0,
        failed: [],
      };

      set({ isMutating: true, error: null });

      const knownUnits = [...get().units];

      try {
        for (const entry of entries) {
          if (!isImportableCatalogUnit(entry)) {
            result.skipped += 1;
            continue;
          }

          if (findDuplicateUnit(entry, knownUnits)) {
            result.skipped += 1;
            continue;
          }

          try {
            const created = await measurementUnitsApi.create(
              toMeasurementUnitRequest(entry)
            );
            knownUnits.push(created);
            set((state) => ({
              units: sortMeasurementUnits([...state.units, created]),
            }));
            result.created += 1;
          } catch (error) {
            if (isDuplicateResponse(error)) {
              result.skipped += 1;
              continue;
            }

            result.failed.push({
              name: entry.name,
              message: getErrorMessage(
                error,
                "No se pudo importar la unidad"
              ),
            });
          }
        }

        set({
          isMutating: false,
          error:
            result.failed.length > 0
              ? `${result.failed.length} unidades no se pudieron importar`
              : null,
        });
        return result;
      } catch (error) {
        set({
          isMutating: false,
          error: getErrorMessage(
            error,
            "No se pudieron importar las unidades de medida"
          ),
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  })
);
