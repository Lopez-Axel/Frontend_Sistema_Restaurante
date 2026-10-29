/**
 * Utilidades compartidas para los campos numéricos con controles de
 * incremento/decremento propios (`StepperControls`).
 */

/**
 * Clase para los `input[type="number"]` que ocultan las flechas nativas del
 * navegador; `pr-10` reserva el espacio de los botones propios.
 */
export const NUMBER_INPUT_CLASS =
  "pr-10 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function stepDecimals(step: number): number {
  return step.toString().split(".")[1]?.length ?? 0;
}

/**
 * Calcula el siguiente valor respetando `min`, `max` y los decimales del
 * `step`, para que los botones nunca salgan del rango permitido.
 */
export function clampStep(
  current: number | null | undefined,
  direction: 1 | -1,
  step: number,
  min: number,
  max: number
): number {
  const base =
    typeof current === "number" && Number.isFinite(current) ? current : 0;
  const next = Math.min(max, Math.max(min, base + direction * step));
  return Number(next.toFixed(stepDecimals(step)));
}
