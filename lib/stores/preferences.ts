"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  statusColors: Record<string, string>;
  setStatusColor: (statusName: string, color: string) => void;
  resetStatusColor: (statusName: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      statusColors: {},
      setStatusColor: (statusName, color) =>
        set((state) => ({
          statusColors: { ...state.statusColors, [statusName]: color },
        })),
      resetStatusColor: (statusName) =>
        set((state) => {
          const next = { ...state.statusColors };
          delete next[statusName];
          return { statusColors: next };
        }),
    }),
    { name: "gatochef-preferences", skipHydration: true }
  )
);
