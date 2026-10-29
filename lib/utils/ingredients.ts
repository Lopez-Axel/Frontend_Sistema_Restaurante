import type { components } from "@/types/api";

export type Ingredient = components["schemas"]["IngredientDTO"];
export type IngredientRequest = components["schemas"]["IngredientRequest"];
export type StockAlert = components["schemas"]["StockAlertDTO"];
export type StockAlertOverview =
  components["schemas"]["StockAlertOverviewDTO"];
export type StockNotification =
  components["schemas"]["StockNotificationDTO"];

export const INVENTORY_FILTERS = ["ALL", "LOW"] as const;
export type InventoryFilter = (typeof INVENTORY_FILTERS)[number];

const quantityFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
});

export function formatStock(
  value: number | null | undefined,
  abbreviation?: string | null
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const quantity = quantityFormatter.format(value);
  const unit = abbreviation?.trim();
  return unit ? `${quantity} ${unit}` : quantity;
}

export function ingredientUnitLabel(ingredient: Ingredient): string {
  return (
    ingredient.unitAbbreviation?.trim() ||
    ingredient.unitName?.trim() ||
    "Sin unidad"
  );
}

export function lowStockIdSet(ingredients?: Ingredient[]): Set<string> {
  return new Set(
    (ingredients ?? [])
      .map((ingredient) => ingredient.id)
      .filter((id): id is string => !!id)
  );
}

export function sortIngredients(
  ingredients: Ingredient[],
  sort?: { id: string; desc: boolean }
): Ingredient[] {
  if (!sort) {
    return [...ingredients].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", {
        sensitivity: "base",
        numeric: true,
      })
    );
  }

  const direction = sort.desc ? -1 : 1;

  return [...ingredients].sort((a, b) => {
    if (sort.id === "currentStock" || sort.id === "minimumStock") {
      const aValue =
        typeof a[sort.id] === "number" ? (a[sort.id] as number) : 0;
      const bValue =
        typeof b[sort.id] === "number" ? (b[sort.id] as number) : 0;
      return (aValue - bValue) * direction;
    }

    if (sort.id === "unitAbbreviation") {
      return (
        ingredientUnitLabel(a).localeCompare(
          ingredientUnitLabel(b),
          "es",
          { sensitivity: "base", numeric: true }
        ) * direction
      );
    }

    if (sort.id === "name") {
      return (
        (a.name ?? "").localeCompare(b.name ?? "", "es", {
          sensitivity: "base",
          numeric: true,
        }) * direction
      );
    }

    return 0;
  });
}

export function latestNotification(
  overview?: StockAlertOverview
): StockNotification | undefined {
  const notifications = overview?.notifications ?? [];
  if (notifications.length === 0) return undefined;

  return [...notifications].sort((a, b) => {
    const aDate = Date.parse(a.sentAt ?? a.createdAt ?? "");
    const bDate = Date.parse(b.sentAt ?? b.createdAt ?? "");
    if (Number.isNaN(aDate) && Number.isNaN(bDate)) return 0;
    if (Number.isNaN(aDate)) return 1;
    if (Number.isNaN(bDate)) return -1;
    return bDate - aDate;
  })[0];
}

export function countAlertsByStatus(overview?: StockAlertOverview) {
  const alerts = overview?.alerts ?? [];
  return {
    open: alerts.filter((alert) => alert.status === "OPEN").length,
    notified: alerts.filter((alert) => alert.status === "NOTIFIED").length,
    resolved: alerts.filter((alert) => alert.status === "RESOLVED").length,
  };
}

export function notificationStatusLabel(status?: string): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "SENT":
      return "Enviada";
    case "FAILED":
      return "Error de envío";
    default:
      return "Sin estado";
  }
}

export function notificationStatusTone(status?: string): string {
  switch (status) {
    case "SENT":
      return "bg-hub-neon-green/15 text-hub-neon-green";
    case "PENDING":
      return "bg-primary/15 text-hub-electric-soft";
    case "FAILED":
      return "bg-hub-neon-red/15 text-hub-neon-red";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function notificationStatusTextTone(status?: string): string {
  switch (status) {
    case "SENT":
      return "text-hub-neon-green";
    case "PENDING":
      return "text-hub-electric-soft";
    case "FAILED":
      return "text-hub-neon-red";
    default:
      return "text-muted-foreground";
  }
}

export function alertStatusLabel(status?: string): string {
  switch (status) {
    case "OPEN":
      return "Abierta";
    case "NOTIFIED":
      return "Notificada";
    case "RESOLVED":
      return "Resuelta";
    default:
      return "Sin estado";
  }
}

export function alertStatusTone(status?: string): string {
  switch (status) {
    case "OPEN":
      return "bg-hub-neon-red/15 text-hub-neon-red";
    case "NOTIFIED":
      return "bg-hub-neon-green/15 text-hub-neon-green";
    case "RESOLVED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function notificationErrorDescription(
  notification: StockNotification
): string | null {
  if (notification.status !== "FAILED") return null;
  return notification.nextAttemptAt
    ? "El servidor no pudo completar el envío y programó un nuevo intento."
    : "El servidor no pudo completar el envío y no programó otro intento.";
}
