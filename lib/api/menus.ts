import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

export type MenuResponse = components["schemas"]["MenuResponse"];
export type MenuDishResponse = components["schemas"]["MenuDishResponse"];
export type MenuRequest = components["schemas"]["MenuRequest"];
export type AddMenuDishRequest = components["schemas"]["AddMenuDishRequest"];

export const menusApi = {
  list() {
    return apiFetch<MenuResponse[]>("/menus");
  },
  get(menuId: string) {
    return apiFetch<MenuResponse>(`/menus/${menuId}`);
  },
  create(body: MenuRequest) {
    return apiFetch<MenuResponse>("/menus", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(menuId: string, body: MenuRequest) {
    return apiFetch<MenuResponse>(`/menus/${menuId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(menuId: string) {
    return apiFetch<void>(`/menus/${menuId}`, { method: "DELETE" });
  },
  dishes(menuId: string) {
    return apiFetch<MenuDishResponse[]>(`/menus/${menuId}/dishes`);
  },
  addDish(menuId: string, body: AddMenuDishRequest) {
    return apiFetch<MenuDishResponse>(`/menus/${menuId}/dishes`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  removeDish(menuId: string, menuDishId: string) {
    return apiFetch<void>(`/menus/${menuId}/dishes/${menuDishId}`, {
      method: "DELETE",
    });
  },
};

// El catálogo de platos vive en lib/api/dishes.ts (incluye imagen,
// ingredientes y análisis). Se reexporta aquí para no romper los imports
// del módulo de pedidos.
export { dishesApi } from "@/lib/api/dishes";
