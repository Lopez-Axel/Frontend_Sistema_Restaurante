import type { components } from "@/types/api";

export type Dish = components["schemas"]["DishDTO"];
export type DishIngredient = components["schemas"]["DishIngredientDTO"];
export type CostAnalysis = components["schemas"]["CostAnalysisDTO"];
export type DishSummary = components["schemas"]["DishSummaryDTO"];
export type { AuditUser } from "@/lib/utils/audit";

/**
 * Capacidades derivadas de las anotaciones @PreAuthorize del backend:
 * - POST/PUT /dishes, /dishes/{id}/ingredients*  -> ADMIN, CHEF
 * - DELETE /dishes/{id}                          -> ADMIN
 * - POST /dishes/{id}/image                      -> ADMIN
 * - /dishes/{id}/cost-analysis, /production-cost,
 *   PATCH /dishes/{id}/selling-price, /summary   -> ADMIN
 * - GET /dishes?analysis=true                    -> ADMIN
 *
 * El frontend solo oculta controles; la autorización real sigue siendo del
 * backend.
 */
export interface DishPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageIngredients: boolean;
  canUploadImage: boolean;
  canViewCostAnalysis: boolean;
  canUpdateSellingPrice: boolean;
  canRequestAnalysisList: boolean;
}

export function dishPermissions(role?: string | null): DishPermissions {
  const isAdmin = role === "ADMIN";
  const isChef = role === "CHEF";

  return {
    canCreate: isAdmin || isChef,
    canEdit: isAdmin || isChef,
    canDelete: isAdmin,
    canManageIngredients: isAdmin || isChef,
    canUploadImage: isAdmin,
    canViewCostAnalysis: isAdmin,
    canUpdateSellingPrice: isAdmin,
    canRequestAnalysisList: isAdmin,
  };
}

export const DISH_STATUS_LABELS: Record<string, string> = {
  NO_PRICE: "Sin precio",
  LOSS: "Pérdida",
  PRICED: "Precio correcto",
  LOW_MARGIN: "Margen bajo",
  OVERPRICED: "Sobreprecio",
};

export function dishStatusLabel(status?: string | null): string {
  if (!status) return "Sin estado";
  return DISH_STATUS_LABELS[status] ?? status;
}

export function dishStatusTone(status?: string | null): string {
  switch (status) {
    case "PRICED":
      return "bg-hub-neon-green/15 text-hub-neon-green";
    case "LOW_MARGIN":
      return "bg-amber-400/15 text-amber-300";
    case "OVERPRICED":
      return "bg-primary/15 text-hub-electric-soft";
    case "LOSS":
      return "bg-hub-neon-red/15 text-hub-neon-red";
    case "NO_PRICE":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function dishAvailabilityLabel(available?: boolean | null): string {
  return available === false ? "No disponible" : "Disponible";
}

export function dishAvailabilityTone(available?: boolean | null): string {
  return available === false
    ? "bg-muted text-muted-foreground"
    : "bg-hub-neon-green/15 text-hub-neon-green";
}

/**
 * El backend devuelve la imagen como ruta relativa servida por su propio
 * `/uploads/**`. Como ese endpoint está protegido con JWT, las peticiones
 * desde el navegador pasan por un proxy interno `/api/uploads/*` que reenvía
 * el header Authorization al backend.
 */
export function dishImageSrc(imageUrl?: string | null): string | null {
  const value = imageUrl?.trim();
  if (!value) return null;
  if (value.toLowerCase() === "string") return null;

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;

  const path = value.startsWith("/") ? value : `/${value}`;
  if (path === "/string") return null;

  if (path.startsWith("/uploads/")) {
    return `/api/uploads${path.slice("/uploads".length)}`;
  }

  return path;
}

export function matchesDishSearch(dish: Dish, query: string): boolean {
  const term = query.trim().toLocaleLowerCase("es");
  if (!term) return true;

  return [dish.name, dish.description, dish.categoryName]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLocaleLowerCase("es").includes(term));
}

export function filterDishesByCategory(
  dishes: Dish[],
  categoryId: string | null
): Dish[] {
  if (!categoryId) return dishes;
  return dishes.filter((dish) => dish.categoryId === categoryId);
}

export function countDishesByCategory(dishes: Dish[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const dish of dishes) {
    if (!dish.categoryId) continue;
    counts.set(dish.categoryId, (counts.get(dish.categoryId) ?? 0) + 1);
  }
  return counts;
}

export function dishIngredientUnitLabel(
  ingredient: DishIngredient
): string {
  return (
    ingredient.unitAbbreviation?.trim() ||
    ingredient.unitName?.trim() ||
    "Sin unidad"
  );
}

/**
 * El modelo actual no distingue de forma explícita si el costo de producción
 * guardado es manual o calculado: solo existe `productionCost`. Por eso la
 * interfaz presenta las dos operaciones como pasos independientes y nunca
 * infiere el modo a partir de los datos.
 */
export const PRODUCTION_COST_MODES = ["manual", "calculated"] as const;
export type ProductionCostMode = (typeof PRODUCTION_COST_MODES)[number];
