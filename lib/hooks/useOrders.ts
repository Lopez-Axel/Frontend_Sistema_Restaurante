"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ordersApi, type OrdersListParams } from "@/lib/api/orders";
import type { components } from "@/types/api";

type OrderCreateRequest = components["schemas"]["OrderCreateRequest"];
type OrderDetailCreateRequest = components["schemas"]["OrderDetailCreateRequest"];
type OrderStatusName = NonNullable<
  components["schemas"]["OrderStatusUpdateRequest"]["statusName"]
>;

export const orderQueryKeys = {
  lists: ["orders", "list"] as const,
  list: (params: OrdersListParams) => ["orders", "list", params] as const,
  my: (params: OrdersListParams) => ["orders", "my", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  details: (id: string) => ["orders", "detail", id, "lines"] as const,
};

export function useOrders(params: OrdersListParams) {
  return useQuery({
    queryKey: orderQueryKeys.list(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useMyOrders(params: Omit<OrdersListParams, "tableId">) {
  return useQuery({
    queryKey: orderQueryKeys.my(params),
    queryFn: () => ordersApi.my(params),
    placeholderData: (previous) => previous,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
}

export function useOrderDetails(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.details(orderId),
    queryFn: () => ordersApi.details(orderId),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OrderCreateRequest) => ordersApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido creado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el pedido"
      );
    },
  });
}

export function useAddOrderDetail(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OrderDetailCreateRequest) =>
      ordersApi.addDetail(orderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Plato agregado al pedido");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al agregar el plato");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statusName }: { id: string; statusName: OrderStatusName }) =>
      ordersApi.updateStatus(id, statusName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Estado del pedido actualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar el estado"
      );
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido eliminado");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el pedido");
    },
  });
}