"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { components } from "@/types/api";

type UserResponse = components["schemas"]["UserResponse"];
export type Role = "WAITER" | "CHEF" | "ADMIN";

interface AuthSession {
  accessToken?: string;
  refreshToken?: string;
  user?: UserResponse;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  hasHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setSession: (session) =>
        set({
          accessToken: session.accessToken ?? null,
          refreshToken: session.refreshToken ?? null,
          user: session.user ?? null,
        }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "gatochef-auth",
      skipHydration: true,
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
