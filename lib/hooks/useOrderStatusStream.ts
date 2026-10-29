"use client";

import { useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api/http";
import { useAuthStore } from "@/lib/stores/auth";

export function useOrderStatusStream(enabled = true) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const controller = new AbortController();
    let stopped = false;

    const refresh = () => {
      if (stopped) return;
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    fetchEventSource(`${API_BASE_URL}/orders/status-stream`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
      onopen: async () => {
        refresh();
      },
      onmessage: () => refresh(),
      onerror: () => {
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