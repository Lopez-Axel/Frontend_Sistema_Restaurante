import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type DishDTO = components["schemas"]["DishDTO"];
type DishRequest = components["schemas"]["DishRequest"];
type DishIngredientDTO = components["schemas"]["DishIngredientDTO"];
type DishIngredientRequest = components["schemas"]["DishIngredientRequest"];
type CostAnalysisDTO = components["schemas"]["CostAnalysisDTO"];
type DishSummaryDTO = components["schemas"]["DishSummaryDTO"];
type SellingPriceRequest = components["schemas"]["SellingPriceRequest"];

export const dishesApi = {
  list(analysis = false) {
    const query = analysis ? "?analysis=true" : "";
    return apiFetch<DishDTO[]>(`/dishes${query}`);
  },
  get(id: string) {
    return apiFetch<DishDTO>(`/dishes/${id}`);
  },
  create(body: DishRequest) {
    return apiFetch<DishDTO>("/dishes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: DishRequest) {
    return apiFetch<DishDTO>(`/dishes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/dishes/${id}`, { method: "DELETE" });
  },
  ingredients(id: string) {
    return apiFetch<DishIngredientDTO[]>(`/dishes/${id}/ingredients`);
  },
  addIngredient(id: string, body: DishIngredientRequest) {
    return apiFetch<DishIngredientDTO>(`/dishes/${id}/ingredients`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateIngredient(
    id: string,
    dishIngredientId: string,
    body: DishIngredientRequest
  ) {
    return apiFetch<DishIngredientDTO>(
      `/dishes/${id}/ingredients/${dishIngredientId}`,
      { method: "PUT", body: JSON.stringify(body) }
    );
  },
  removeIngredient(id: string, dishIngredientId: string) {
    return apiFetch<void>(`/dishes/${id}/ingredients/${dishIngredientId}`, {
      method: "DELETE",
    });
  },
  // Consulta el análisis de costos sin persistir nada.
  costAnalysis(id: string) {
    return apiFetch<CostAnalysisDTO>(`/dishes/${id}/cost-analysis`);
  },
  // Ojo: recalcula el costo de producción y lo PERSISTE en el plato.
  recomputeProductionCost(id: string) {
    return apiFetch<CostAnalysisDTO>(`/dishes/${id}/production-cost`);
  },
  updateSellingPrice(id: string, sellingPrice: number) {
    const body: SellingPriceRequest = { sellingPrice };
    return apiFetch<DishDTO>(`/dishes/${id}/selling-price`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  summary(id: string) {
    return apiFetch<DishSummaryDTO>(`/dishes/${id}/summary`);
  },
  uploadImage(id: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<DishDTO>(`/dishes/${id}/image`, {
      method: "POST",
      body: form,
    });
  },
};

export type { DishDTO, DishRequest, DishIngredientDTO, DishIngredientRequest };
