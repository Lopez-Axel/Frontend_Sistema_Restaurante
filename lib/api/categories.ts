import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type CategoryDTO = components["schemas"]["CategoryDTO"];
type CategoryRequest = components["schemas"]["CategoryRequest"];

export const categoriesApi = {
  list() {
    return apiFetch<CategoryDTO[]>("/categories");
  },
  get(id: string) {
    return apiFetch<CategoryDTO>(`/categories/${id}`);
  },
  create(body: CategoryRequest) {
    return apiFetch<CategoryDTO>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: CategoryRequest) {
    return apiFetch<CategoryDTO>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/categories/${id}`, { method: "DELETE" });
  },
};
