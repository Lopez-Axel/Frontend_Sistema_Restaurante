import type { components } from "@/types/api";

export type TableStatusName = NonNullable<
  components["schemas"]["TableStatus"]["name"]
>;

export const TABLE_STATUS_NAMES: TableStatusName[] = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
];

export const TABLE_STATUS_LABELS: Record<TableStatusName, string> = {
  AVAILABLE: "Disponible",
  OCCUPIED: "Ocupada",
  RESERVED: "Reservada",
  CLEANING: "Limpieza",
};

// Colores por defecto (hex), alineados con la paleta del tema.
export const TABLE_STATUS_DEFAULT_COLORS: Record<TableStatusName, string> = {
  AVAILABLE: "#00e676",
  OCCUPIED: "#ff3b5c",
  RESERVED: "#4f3bff",
  CLEANING: "#a6aed6",
};

const FALLBACK_COLOR = "#a6aed6";

export interface TableStatusUi {
  name: string;
  label: string;
  color: string;
  text: string;
}

// Texto legible (blanco/oscuro) sobre un color de fondo dado.
export function readableOn(hex: string): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#ffffff";
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

export function statusLabel(name: string | undefined): string {
  if (name && name in TABLE_STATUS_LABELS) return TABLE_STATUS_LABELS[name as TableStatusName];
  return name ?? "Sin estado";
}

export function resolveTableStatus(
  statusValue: string | undefined,
  statuses: components["schemas"]["TableStatus"][] = [],
  overrides: Record<string, string> = {}
): TableStatusUi {
  if (!statusValue) {
    return {
      name: "",
      label: "Sin estado",
      color: FALLBACK_COLOR,
      text: readableOn(FALLBACK_COLOR),
    };
  }
  const known = statuses.find((s) => s.id === statusValue || s.name === statusValue);
  const name = (known?.name ?? statusValue) as string;
  const isEnum = TABLE_STATUS_NAMES.includes(name as TableStatusName);
  const color =
    overrides[name] ??
    (isEnum ? TABLE_STATUS_DEFAULT_COLORS[name as TableStatusName] : FALLBACK_COLOR);
  return {
    name,
    label: statusLabel(name),
    color,
    text: readableOn(color),
  };
}