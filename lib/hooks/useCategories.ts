"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi } from "@/lib/api/categories";
import type { components } from "@/types/api";

type CategoryDTO = components["schemas"]["CategoryDTO"];
type CategoryRequest = components["schemas"]["CategoryRequest"];

export const categoryQueryKeys = {
  categories: ["categories"] as const,
  detail: (id: string) => ["categories", id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.categories,
    queryFn: () => categoriesApi.list(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryRequest) => categoriesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al crear la categoría"
      );
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CategoryRequest }) =>
      categoriesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría actualizada");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar la categoría"
      );
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría eliminada");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar la categoría"
      );
    },
  });
}

export type { CategoryDTO };
