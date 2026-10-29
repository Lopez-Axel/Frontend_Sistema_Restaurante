"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useAuthStore } from "@/lib/stores/auth";
import { tryRefresh } from "@/lib/api/http";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      })
  );

  // La persistencia arranca saltada para evitar desajustes de hidratación SSR;
  // se rehidrata una vez montado el cliente.
  useEffect(() => {
    usePreferencesStore.persist.rehydrate();

    void (async () => {
      await useAuthStore.persist.rehydrate();
      const { refreshToken, accessToken } = useAuthStore.getState();
      if (refreshToken && !accessToken) {
        await tryRefresh();
      }
      useAuthStore.getState().setHydrated(true);
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}