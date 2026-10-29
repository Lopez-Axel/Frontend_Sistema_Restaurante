"use client";

import { useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/http";
import { useAuthStore } from "@/lib/stores/auth";

export function useTableStatusStream(enabled = true) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const controller = new AbortController();
    let stopped = false;

    const refresh = () => {
      if (stopped) return;
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    };

    fetchEventSource(`${API_BASE_URL}/restaurantTable/status-stream`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
      onopen: async () => {
        refresh();
      },
      onmessage: () => refresh(),
      onerror: () => {
        // Reintento automático con backoff del propio cliente; se detiene al desmontar.
        return;
      },
    }).catch(() => {
      // La cancelación al desmontar cierra la conexión con normalidad.
    });

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [enabled, accessToken, queryClient]);
}