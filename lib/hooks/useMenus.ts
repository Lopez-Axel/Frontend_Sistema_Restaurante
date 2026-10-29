"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  dishesApi,
  menusApi,
  type AddMenuDishRequest,
  type MenuRequest,
  type MenuResponse,
} from "@/lib/api/menus";
import { getErrorMessage } from "@/lib/utils/errors";

export interface OrderCatalogDish {
  id: string;
  name: string;
  sellingPrice?: number;
  available?: boolean;
  menus: string[];
}

export const orderCatalogQueryKeys = {
  menus: ["menus"] as const,
  menuDishes: (menuId: string) => ["menus", menuId, "dishes"] as const,
  dishes: ["dishes"] as const,
  catalog: ["order-catalog"] as const,
};

export const menuQueryKeys = {
  list: ["menus"] as const,
  detail: (menuId: string) => ["menus", "detail", menuId] as const,
  dishes: (menuId: string) => ["menus", menuId, "dishes"] as const,
};

export function useMenus() {
  return useQuery({
    queryKey: orderCatalogQueryKeys.menus,
    queryFn: () => menusApi.list(),
  });
}

export function useMenu(menuId?: string) {
  return useQuery({
    queryKey: menuQueryKeys.detail(menuId ?? ""),
    queryFn: () => menusApi.get(menuId as string),
    enabled: !!menuId,
  });
}

export function useMenuDishes(menuId?: string) {
  return useQuery({
    queryKey: menuQueryKeys.dishes(menuId ?? ""),
    queryFn: () => menusApi.dishes(menuId as string),
    enabled: !!menuId,
  });
}

export function useDishes() {
  return useQuery({
    queryKey: orderCatalogQueryKeys.dishes,
    queryFn: () => dishesApi.list(false),
  });
}

function useInvalidateMenus() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.list }),
      queryClient.invalidateQueries({
        queryKey: orderCatalogQueryKeys.catalog,
      }),
    ]);
}

export function useCreateMenu() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: (body: MenuRequest) => menusApi.create(body),
    onSuccess: async () => {
      await invalidate();
      toast.success("Menú creado");
    },
  });
}

export function useUpdateMenu() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: ({ menuId, body }: { menuId: string; body: MenuRequest }) =>
      menusApi.update(menuId, body),
    onSuccess: async () => {
      await invalidate();
      toast.success("Menú actualizado");
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: (menuId: string) => menusApi.remove(menuId),
    onSuccess: async (_data, menuId) => {
      queryClient.removeQueries({ queryKey: menuQueryKeys.detail(menuId) });
      queryClient.removeQueries({ queryKey: menuQueryKeys.dishes(menuId) });
      await invalidate();
      toast.success("Menú eliminado");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar el menú"));
    },
  });
}

export function useAddMenuDish() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: ({
      menuId,
      body,
    }: {
      menuId: string;
      body: AddMenuDishRequest;
    }) => menusApi.addDish(menuId, body),
    onSuccess: async () => {
      await invalidate();
      toast.success("Plato agregado al menú");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo agregar el plato"));
    },
  });
}

export function useRemoveMenuDish() {
  const invalidate = useInvalidateMenus();

  return useMutation({
    mutationFn: ({
      menuId,
      menuDishId,
    }: {
      menuId: string;
      menuDishId: string;
    }) => menusApi.removeDish(menuId, menuDishId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Plato retirado del menú");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "No se pudo retirar el plato"));
    },
  });
}

// Platos que pueden ordenarse: los que pertenecen a algún menú activo.
export function useOrderCatalog() {
  const menusQuery = useQuery({
    queryKey: orderCatalogQueryKeys.menus,
    queryFn: () => menusApi.list(),
  });
  const dishesQuery = useQuery({
    queryKey: orderCatalogQueryKeys.dishes,
    queryFn: () => dishesApi.list(false),
  });
  const menuIds = (menusQuery.data ?? [])
    .filter((menu) => menu.active !== false)
    .map((menu: MenuResponse) => menu.id)
    .filter((id): id is string => !!id);

  const menuDishesQueries = useQuery({
    queryKey: orderCatalogQueryKeys.catalog,
    queryFn: async () => {
      const activeMenus = (menusQuery.data ?? []).filter(
        (menu) => menu.active !== false
      );
      const perMenu = await Promise.all(
        activeMenus.map(async (menu) => ({
          menuId: menu.id,
          dishes: menu.id ? await menusApi.dishes(menu.id) : [],
        }))
      );
      return perMenu;
    },
    enabled: menusQuery.isSuccess,
  });

  const catalog: OrderCatalogDish[] = [];
  const seen = new Set<string>();
  for (const group of menuDishesQueries.data ?? []) {
    for (const entry of group.dishes) {
      if (!entry.dishId || seen.has(entry.dishId)) continue;
      seen.add(entry.dishId);
      const dish = (dishesQuery.data ?? []).find((d) => d.id === entry.dishId);
      catalog.push({
        id: entry.dishId,
        name: entry.dishName ?? dish?.name ?? "Plato",
        sellingPrice: dish?.sellingPrice,
        available: dish?.available,
        menus: [],
      });
    }
  }

  return {
    menus: menusQuery.data ?? [],
    catalog,
    isLoading:
      menusQuery.isLoading || dishesQuery.isLoading || menuDishesQueries.isLoading,
    isError: menusQuery.isError || dishesQuery.isError || menuDishesQueries.isError,
    activeMenuIds: menuIds,
  };
}
