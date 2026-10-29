"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ingredientsApi } from "@/lib/api/ingredients";
import type { IngredientRequest } from "@/lib/utils/ingredients";

const INGREDIENTS_KEY = ["ingredients"] as const;

export const ingredientQueryKeys = {
  all: INGREDIENTS_KEY,
  list: [...INGREDIENTS_KEY, "list"] as const,
  lowStock: [...INGREDIENTS_KEY, "low-stock"] as const,
  alerts: [...INGREDIENTS_KEY, "alerts"] as const,
  details: [...INGREDIENTS_KEY, "detail"] as const,
  detail: (id: string) => [...INGREDIENTS_KEY, "detail", id] as const,
};

function invalidateInventory(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ingredientQueryKeys.list }),
    queryClient.invalidateQueries({ queryKey: ingredientQueryKeys.lowStock }),
    queryClient.invalidateQueries({ queryKey: ingredientQueryKeys.alerts }),
  ]);
}

export function useIngredients(enabled = true) {
  return useQuery({
    queryKey: ingredientQueryKeys.list,
    queryFn: () => ingredientsApi.list(),
    enabled,
  });
}

export function useLowStockIngredients(enabled = true) {
  return useQuery({
    queryKey: ingredientQueryKeys.lowStock,
    queryFn: () => ingredientsApi.lowStock(),
    enabled,
  });
}

export function useStockAlertOverview(enabled = true) {
  return useQuery({
    queryKey: ingredientQueryKeys.alerts,
    queryFn: () => ingredientsApi.alerts(),
    enabled,
  });
}

export function useIngredient(id?: string) {
  return useQuery({
    queryKey: ingredientQueryKeys.detail(id ?? ""),
    queryFn: () => ingredientsApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: IngredientRequest) => ingredientsApi.create(body),
    onSuccess: (created) => {
      if (created.id) {
        queryClient.setQueryData(
          ingredientQueryKeys.detail(created.id),
          created
        );
      }
      toast.success("Ingrediente creado");
      void invalidateInventory(queryClient);
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: IngredientRequest }) =>
      ingredientsApi.update(id, body),
    onSuccess: (updated, variables) => {
      const ingredient = updated.id ? updated : { ...updated, id: variables.id };
      queryClient.setQueryData(
        ingredientQueryKeys.detail(variables.id),
        ingredient
      );
      toast.success("Ingrediente actualizado");
      void invalidateInventory(queryClient);
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ingredientsApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({
        queryKey: ingredientQueryKeys.detail(id),
        exact: true,
      });
      toast.success("Ingrediente eliminado");
      void invalidateInventory(queryClient);
    },
  });
}
