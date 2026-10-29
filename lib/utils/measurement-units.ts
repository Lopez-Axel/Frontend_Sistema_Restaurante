import type { components } from "@/types/api";

export type MeasurementUnit = components["schemas"]["MeasurementUnitDTO"];
export type MeasurementUnitRequest =
  components["schemas"]["MeasurementUnitRequest"];

export const UNIT_TYPES = ["WEIGHT", "VOLUME", "COUNT"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export type CatalogMagnitude = UnitType | "LENGTH";

export const CATALOG_MAGNITUDES = [
  "WEIGHT",
  "VOLUME",
  "COUNT",
  "LENGTH",
] as const satisfies readonly CatalogMagnitude[];

export const UNIT_TYPE_LABELS: Record<string, string> = {
  WEIGHT: "Masa",
  VOLUME: "Volumen",
  COUNT: "Conteo",
  LENGTH: "Longitud",
};

export const UNIT_BASES: Record<
  CatalogMagnitude,
  { name: string; abbreviation: string }
> = {
  WEIGHT: { name: "kilogramo", abbreviation: "kg" },
  VOLUME: { name: "litro", abbreviation: "L" },
  COUNT: { name: "unidad", abbreviation: "unit" },
  LENGTH: { name: "metro", abbreviation: "m" },
};

export interface MeasurementUnitCatalogEntry {
  key: string;
  name: string;
  abbreviation: string;
  unitType: CatalogMagnitude;
  conversionFactorToBase: number;
  supported: boolean;
  note?: string;
}

export const MEASUREMENT_UNIT_CATALOG = [
  {
    key: "mg",
    name: "Miligramo",
    abbreviation: "mg",
    unitType: "WEIGHT",
    conversionFactorToBase: 0.000001,
    supported: true,
  },
  {
    key: "g",
    name: "Gramo",
    abbreviation: "g",
    unitType: "WEIGHT",
    conversionFactorToBase: 0.001,
    supported: true,
  },
  {
    key: "kg",
    name: "Kilogramo",
    abbreviation: "kg",
    unitType: "WEIGHT",
    conversionFactorToBase: 1,
    supported: true,
  },
  {
    key: "lb",
    name: "Libra",
    abbreviation: "lb",
    unitType: "WEIGHT",
    conversionFactorToBase: 0.45359237,
    supported: true,
  },
  {
    key: "oz",
    name: "Onza",
    abbreviation: "oz",
    unitType: "WEIGHT",
    conversionFactorToBase: 0.0283495231,
    supported: true,
    note: "1 oz = 28,3495231 g",
  },
  {
    key: "qq",
    name: "Quintal (100 lb)",
    abbreviation: "qq",
    unitType: "WEIGHT",
    conversionFactorToBase: 45.359237,
    supported: true,
    note: "1 qq = 45,359237 kg · convención del backend",
  },
  {
    key: "ml",
    name: "Mililitro",
    abbreviation: "ml",
    unitType: "VOLUME",
    conversionFactorToBase: 0.001,
    supported: true,
  },
  {
    key: "l",
    name: "Litro",
    abbreviation: "l",
    unitType: "VOLUME",
    conversionFactorToBase: 1,
    supported: true,
  },
  {
    key: "m3",
    name: "Metro cúbico",
    abbreviation: "m³",
    unitType: "VOLUME",
    conversionFactorToBase: 1000,
    supported: true,
  },
  {
    key: "taza-240",
    name: "Taza (240 ml)",
    abbreviation: "tza",
    unitType: "VOLUME",
    conversionFactorToBase: 0.24,
    supported: true,
    note: "Convención de 240 ml",
  },
  {
    key: "cucharada-15",
    name: "Cucharada (15 ml)",
    abbreviation: "cda",
    unitType: "VOLUME",
    conversionFactorToBase: 0.015,
    supported: true,
    note: "Convención de 15 ml",
  },
  {
    key: "cucharadita-5",
    name: "Cucharadita (5 ml)",
    abbreviation: "cdta",
    unitType: "VOLUME",
    conversionFactorToBase: 0.005,
    supported: true,
    note: "Convención de 5 ml",
  },
  {
    key: "unit",
    name: "Unidad",
    abbreviation: "unit",
    unitType: "COUNT",
    conversionFactorToBase: 1,
    supported: true,
  },
  {
    key: "pza",
    name: "Pieza",
    abbreviation: "pza",
    unitType: "COUNT",
    conversionFactorToBase: 1,
    supported: true,
  },
  {
    key: "doc",
    name: "Docena",
    abbreviation: "doc",
    unitType: "COUNT",
    conversionFactorToBase: 12,
    supported: true,
  },
  {
    key: "mm",
    name: "Milímetro",
    abbreviation: "mm",
    unitType: "LENGTH",
    conversionFactorToBase: 0.001,
    supported: false,
    note: "El backend actual no admite unidades de longitud",
  },
  {
    key: "cm",
    name: "Centímetro",
    abbreviation: "cm",
    unitType: "LENGTH",
    conversionFactorToBase: 0.01,
    supported: false,
    note: "El backend actual no admite unidades de longitud",
  },
  {
    key: "m",
    name: "Metro",
    abbreviation: "m",
    unitType: "LENGTH",
    conversionFactorToBase: 1,
    supported: false,
    note: "El backend actual no admite unidades de longitud",
  },
] as const satisfies readonly MeasurementUnitCatalogEntry[];

const numberFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 10,
});

export function unitTypeLabel(value: string | undefined | null): string {
  if (!value) return "Sin magnitud";
  return UNIT_TYPE_LABELS[value] ?? value;
}

export function isUnitType(value: string | undefined | null): value is UnitType {
  return !!value && (UNIT_TYPES as readonly string[]).includes(value);
}

export function baseUnitFor(
  value: string | undefined | null
): { name: string; abbreviation: string } | null {
  if (!value || !Object.hasOwn(UNIT_BASES, value)) return null;
  return UNIT_BASES[value as CatalogMagnitude];
}

export function formatConversionFactor(value: number): string {
  return numberFormatter.format(value);
}

export function formatUnitEquivalence(
  unit: Pick<
    MeasurementUnit,
    "name" | "abbreviation" | "unitType" | "conversionFactorToBase"
  >
): string {
  const base = baseUnitFor(unit.unitType);
  if (!base) return "Magnitud no reconocida";

  const factor = unit.conversionFactorToBase;
  if (typeof factor !== "number" || !Number.isFinite(factor) || factor <= 0) {
    return `Sin equivalencia válida · base ${base.name} (${base.abbreviation})`;
  }

  const symbol = unit.abbreviation?.trim() || unit.name?.trim() || "unidad";

  if (factor === 1) {
    const isBaseUnit =
      normalizeUnitText(unit.abbreviation) ===
      normalizeUnitText(base.abbreviation);
    return isBaseUnit
      ? `Unidad base · ${base.name} (${base.abbreviation})`
      : `1 ${symbol} = 1 ${base.abbreviation}`;
  }

  return `1 ${symbol} = ${formatConversionFactor(factor)} ${base.abbreviation}`;
}

export function normalizeUnitText(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function matchesUnitSearch(
  unit: Pick<MeasurementUnit, "name" | "abbreviation" | "unitType">,
  query: string
): boolean {
  const needle = normalizeUnitText(query);
  if (!needle) return true;

  return [unit.name, unit.abbreviation, unitTypeLabel(unit.unitType)].some(
    (value) => normalizeUnitText(value).includes(needle)
  );
}

export function findDuplicateUnit(
  candidate: Pick<MeasurementUnit, "name" | "abbreviation">,
  units: MeasurementUnit[]
): MeasurementUnit | undefined {
  const name = normalizeUnitText(candidate.name);
  const abbreviation = normalizeUnitText(candidate.abbreviation);

  return units.find((unit) => {
    const unitName = normalizeUnitText(unit.name);
    const unitAbbreviation = normalizeUnitText(unit.abbreviation);
    return (
      (!!name && unitName === name) ||
      (!!abbreviation && unitAbbreviation === abbreviation)
    );
  });
}

export function sortMeasurementUnits(
  units: MeasurementUnit[]
): MeasurementUnit[] {
  const order = new Map<string, number>(
    CATALOG_MAGNITUDES.map((type, index) => [type, index] as const)
  );

  return [...units].sort((a, b) => {
    const typeDifference =
      (order.get(a.unitType ?? "") ?? 99) - (order.get(b.unitType ?? "") ?? 99);
    if (typeDifference !== 0) return typeDifference;
    return (a.name ?? "").localeCompare(b.name ?? "", "es", {
      sensitivity: "base",
    });
  });
}

export function magnitudeBadgeClass(
  value: string | undefined | null
): string {
  switch (value) {
    case "WEIGHT":
      return "bg-hub-neon-green/15 text-hub-neon-green";
    case "VOLUME":
      return "bg-primary/15 text-primary";
    case "COUNT":
      return "bg-hub-mist/15 text-hub-mist";
    case "LENGTH":
      return "bg-hub-neon-red/15 text-hub-neon-red";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function isImportableCatalogUnit(
  unit: MeasurementUnitCatalogEntry
): unit is MeasurementUnitCatalogEntry & { unitType: UnitType } {
  return unit.supported && isUnitType(unit.unitType);
}

export function toMeasurementUnitRequest(
  unit: MeasurementUnitCatalogEntry
): MeasurementUnitRequest {
  if (!isImportableCatalogUnit(unit)) {
    throw new Error(
      `La unidad "${unit.name}" no es compatible con el backend actual`
    );
  }

  return {
    name: unit.name,
    abbreviation: unit.abbreviation,
    unitType: unit.unitType,
    conversionFactorToBase: unit.conversionFactorToBase,
  };
}
