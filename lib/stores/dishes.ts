"use client";

import { create } from "zustand";

interface DishesUiState {
  /** Texto del buscador del catálogo. */
  search: string;
  /** Categoría activa del filtro; null significa "todas". */
  categoryId: string | null;
  /** El ADMIN puede pedir el listado con `?analysis=true`. */
  analysisEnabled: boolean;
  setSearch: (value: string) => void;
  setCategoryId: (value: string | null) => void;
  setAnalysisEnabled: (value: boolean) => void;
  resetFilters: () => void;
}

/**
 * Solo estado de interfaz del módulo de platos (filtros). Los datos
 * remotos viven en TanStack Query; Zustand no los duplica.
 */
export const useDishesUiStore = create<DishesUiState>()((set) => ({
  search: "",
  categoryId: null,
  analysisEnabled: false,
  setSearch: (value) => set({ search: value }),
  setCategoryId: (value) => set({ categoryId: value }),
  setAnalysisEnabled: (value) => set({ analysisEnabled: value }),
  resetFilters: () => set({ search: "", categoryId: null, analysisEnabled: false }),
}));
