import { readableOn } from "@/lib/utils/table-status";

export type OrderStatusName =
  | "PENDING"
  | "IN_PROGRESS"
  | "SERVED"
  | "CLOSED"
  | "CANCELLED";

export const ORDER_STATUS_NAMES: OrderStatusName[] = [
  "PENDING",
  "IN_PROGRESS",
  "SERVED",
  "CLOSED",
  "CANCELLED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatusName, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En preparación",
  SERVED: "Servido",
  CLOSED: "Cerrado",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_DEFAULT_COLORS: Record<OrderStatusName, string> = {
  PENDING: "#a6aed6",
  IN_PROGRESS: "#4f3bff",
  SERVED: "#00e676",
  CLOSED: "#5b5a7a",
  CANCELLED: "#ff3b5c",
};

const FALLBACK_COLOR = "#a6aed6";

export interface OrderStatusUi {
  name: string;
  label: string;
  color: string;
  text: string;
}

export function orderStatusLabel(name: string | undefined): string {
  if (name && name in ORDER_STATUS_LABELS) return ORDER_STATUS_LABELS[name as OrderStatusName];
  return name ?? "Sin estado";
}

export function resolveOrderStatus(
  name: string | undefined,
  colorHex?: string
): OrderStatusUi {
  if (!name) {
    return {
      name: "",
      label: "Sin estado",
      color: FALLBACK_COLOR,
      text: readableOn(FALLBACK_COLOR),
    };
  }
  const isEnum = ORDER_STATUS_NAMES.includes(name as OrderStatusName);
  const color =
    colorHex ?? (isEnum ? ORDER_STATUS_DEFAULT_COLORS[name as OrderStatusName] : FALLBACK_COLOR);
  return {
    name,
    label: orderStatusLabel(name),
    color,
    text: readableOn(color),
  };
}

export function isOpenOrder(name: string | undefined): boolean {
  return name === "PENDING" || name === "IN_PROGRESS" || name === "SERVED";
}