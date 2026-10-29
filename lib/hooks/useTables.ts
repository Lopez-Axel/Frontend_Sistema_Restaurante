"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { tablesApi } from "@/lib/api/tables";
import type { components } from "@/types/api";

type TableStatusName = NonNullable<components["schemas"]["TableStatus"]["name"]>;
type RestaurantTableRequest = components["schemas"]["RestaurantTableRequest"];
type UpdateTableStatusRequest = components["schemas"]["UpdateTableStatusRequest"];

export const tableQueryKeys = {
  statuses: ["table-statuses"] as const,
  tables: ["tables"] as const,
  detail: (id: string) => ["tables", id] as const,
  seats: (tableId: string) => ["tables", tableId, "seats"] as const,
  history: (id: string) => ["tables", id, "history"] as const,
};

export function useTableStatuses() {
  return useQuery({
    queryKey: tableQueryKeys.statuses,
    queryFn: () => tablesApi.listStatuses(),
  });
}

export function useRestaurantTables() {
  return useQuery({
    queryKey: tableQueryKeys.tables,
    queryFn: () => tablesApi.list(),
  });
}

export function useRestaurantTable(id: string) {
  return useQuery({
    queryKey: tableQueryKeys.detail(id),
    queryFn: () => tablesApi.get(id),
    enabled: !!id,
  });
}

export function useTableSeats(tableId: string) {
  return useQuery({
    queryKey: tableQueryKeys.seats(tableId),
    queryFn: () => tablesApi.seats(tableId),
    enabled: !!tableId,
  });
}

export function useTableHistory(id: string) {
  return useQuery({
    queryKey: tableQueryKeys.history(id),
    queryFn: () => tablesApi.history(id),
    enabled: !!id,
  });
}

export function useCreateTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: TableStatusName) => tablesApi.createStatus(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-statuses"] });
      toast.success("Estado de mesa creado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el estado"
      );
    },
  });
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: TableStatusName }) =>
      tablesApi.updateStatus(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-statuses"] });
      toast.success("Estado de mesa actualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar el estado"
      );
    },
  });
}

export function useDeleteTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tablesApi.deleteStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-statuses"] });
      toast.success("Estado de mesa eliminado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar el estado"
      );
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RestaurantTableRequest) => tablesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Mesa creada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear la mesa");
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RestaurantTableRequest }) =>
      tablesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Mesa actualizada");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar la mesa"
      );
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tablesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Mesa eliminada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al eliminar la mesa");
    },
  });
}

export function useChangeTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTableStatusRequest }) =>
      tablesApi.changeStatus(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Estado de la mesa actualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar el estado"
      );
    },
  });
}

export function useUpdateSeat(tableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ seatId, occupied }: { seatId: string; occupied: boolean }) =>
      tablesApi.updateSeat(tableId, seatId, occupied),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tableQueryKeys.seats(tableId),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar la silla"
      );
    },
  });
}