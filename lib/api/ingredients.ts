import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type IngredientDTO = components["schemas"]["IngredientDTO"];
type IngredientRequest = components["schemas"]["IngredientRequest"];
type StockAlertOverviewDTO =
  components["schemas"]["StockAlertOverviewDTO"];

export const ingredientsApi = {
  list() {
    return apiFetch<IngredientDTO[]>("/ingredients");
  },
  lowStock() {
    return apiFetch<IngredientDTO[]>("/ingredients/low-stock");
  },
  alerts() {
    return apiFetch<StockAlertOverviewDTO>("/ingredients/alerts");
  },
  get(id: string) {
    return apiFetch<IngredientDTO>(`/ingredients/${id}`);
  },
  create(body: IngredientRequest) {
    return apiFetch<IngredientDTO>("/ingredients", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: IngredientRequest) {
    return apiFetch<IngredientDTO>(`/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/ingredients/${id}`, { method: "DELETE" });
  },
};
