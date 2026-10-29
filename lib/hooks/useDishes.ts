"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { dishesApi } from "@/lib/api/dishes";
import type { DishRequest, DishIngredientRequest } from "@/lib/api/dishes";
import { useAuthStore } from "@/lib/stores/auth";
import { dishPermissions } from "@/lib/utils/dishes";

export const dishQueryKeys = {
  all: ["dishes"] as const,
  list: (analysis: boolean) => ["dishes", "list", { analysis }] as const,
  detail: (id: string) => ["dishes", "detail", id] as const,
  ingredients: (id: string) => ["dishes", id, "ingredients"] as const,
  costAnalysis: (id: string) => ["dishes", id, "cost-analysis"] as const,
  summary: (id: string) => ["dishes", id, "summary"] as const,
};

function invalidateDishCatalog(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dishes"] }),
    queryClient.invalidateQueries({ queryKey: ["order-catalog"] }),
    queryClient.invalidateQueries({ queryKey: ["menus"] }),
  ]);
}

export function useDishesList(analysis = false) {
  const role = useAuthStore((state) => state.user?.role);
  const permissions = dishPermissions(role);
  // `?analysis=true` es exclusivo del ADMIN: nunca se pide sin permiso.
  const shouldAnalyze = analysis && permissions.canRequestAnalysisList;

  return useQuery({
    queryKey: dishQueryKeys.list(shouldAnalyze),
    queryFn: () => dishesApi.list(shouldAnalyze),
  });
}

export function useDish(id?: string) {
  return useQuery({
    queryKey: dishQueryKeys.detail(id ?? ""),
    queryFn: () => dishesApi.get(id as string),
    enabled: !!id,
  });
}

export function useDishIngredients(id?: string) {
  return useQuery({
    queryKey: dishQueryKeys.ingredients(id ?? ""),
    queryFn: () => dishesApi.ingredients(id as string),
    enabled: !!id,
  });
}

export function useDishCostAnalysis(id?: string, enabled = true) {
  const role = useAuthStore((state) => state.user?.role);
  const permissions = dishPermissions(role);

  return useQuery({
    queryKey: dishQueryKeys.costAnalysis(id ?? ""),
    queryFn: () => dishesApi.costAnalysis(id as string),
    enabled: !!id && enabled && permissions.canViewCostAnalysis,
  });
}

export function useDishSummary(id?: string, enabled = true) {
  const role = useAuthStore((state) => state.user?.role);
  const permissions = dishPermissions(role);

  return useQuery({
    queryKey: dishQueryKeys.summary(id ?? ""),
    queryFn: () => dishesApi.summary(id as string),
    enabled: !!id && enabled && permissions.canViewCostAnalysis,
  });
}

export function useCreateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: DishRequest) => dishesApi.create(body),
    onSuccess: (created) => {
      if (created.id) {
        queryClient.setQueryData(dishQueryKeys.detail(created.id), created);
      }
      toast.success("Plato creado");
      void invalidateDishCatalog(queryClient);
    },
  });
}

export function useUpdateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DishRequest }) =>
      dishesApi.update(id, body),
    onSuccess: (updated, variables) => {
      const dish = updated.id ? updated : { ...updated, id: variables.id };
      if (variables.id) {
        queryClient.setQueryData(dishQueryKeys.detail(variables.id), dish);
      }
      toast.success("Plato actualizado");
      void invalidateDishCatalog(queryClient);
    },
  });
}

export function useDeleteDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dishesApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({
        queryKey: dishQueryKeys.detail(id),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: dishQueryKeys.ingredients(id),
        exact: true,
      });
      toast.success("Plato eliminado");
      void invalidateDishCatalog(queryClient);
    },
  });
}

export function useAddDishIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DishIngredientRequest }) =>
      dishesApi.addIngredient(id, body),
    onSuccess: (_data, variables) => {
      if (variables.id) {
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.ingredients(variables.id),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.detail(variables.id),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.costAnalysis(variables.id),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.summary(variables.id),
        });
      }
      void invalidateDishCatalog(queryClient);
      toast.success("Ingrediente agregado al plato");
    },
  });
}

export function useUpdateDishIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dishId,
      dishIngredientId,
      body,
    }: {
      dishId: string;
      dishIngredientId: string;
      body: DishIngredientRequest;
    }) => dishesApi.updateIngredient(dishId, dishIngredientId, body),
    onSuccess: (_data, variables) => {
      if (variables.dishId) {
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.ingredients(variables.dishId),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.detail(variables.dishId),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.costAnalysis(variables.dishId),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.summary(variables.dishId),
        });
      }
      void invalidateDishCatalog(queryClient);
      toast.success("Proporción actualizada");
    },
  });
}

export function useRemoveDishIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dishId,
      dishIngredientId,
    }: {
      dishId: string;
      dishIngredientId: string;
    }) => dishesApi.removeIngredient(dishId, dishIngredientId),
    onSuccess: (_data, variables) => {
      if (variables.dishId) {
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.ingredients(variables.dishId),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.detail(variables.dishId),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.costAnalysis(variables.dishId),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.summary(variables.dishId),
        });
      }
      void invalidateDishCatalog(queryClient);
      toast.success("Ingrediente retirado del plato");
    },
  });
}

export function useUploadDishImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      dishesApi.uploadImage(id, file),
    onSuccess: (updated, variables) => {
      if (variables.id) {
        const dish = updated.id ? updated : { ...updated, id: variables.id };
        queryClient.setQueryData(dishQueryKeys.detail(variables.id), dish);
      }
      toast.success("Imagen actualizada");
      void invalidateDishCatalog(queryClient);
    },
  });
}

export function useUpdateDishSellingPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sellingPrice }: { id: string; sellingPrice: number }) =>
      dishesApi.updateSellingPrice(id, sellingPrice),
    onSuccess: (updated, variables) => {
      const dish = updated.id ? updated : { ...updated, id: variables.id };
      if (variables.id) {
        queryClient.setQueryData(dishQueryKeys.detail(variables.id), dish);
      }
      toast.success("Precio de venta actualizado");
      void invalidateDishCatalog(queryClient);
    },
  });
}

export function useRecomputeDishProductionCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dishesApi.recomputeProductionCost(id),
    onSuccess: (analysis, id) => {
      if (id) {
        queryClient.setQueryData(dishQueryKeys.costAnalysis(id), analysis);
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.detail(id),
        });
        void queryClient.invalidateQueries({
          queryKey: dishQueryKeys.summary(id),
        });
      }
      void invalidateDishCatalog(queryClient);
      toast.success("Costo de producción recalculado");
    },
  });
}
