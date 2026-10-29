import { dinero, toDecimal, BOB } from "dinero.js";

export function formatMoney(amountInCents: number): string {
  const money = dinero({ amount: amountInCents, currency: BOB });
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: BOB.code,
  }).format(Number(toDecimal(money)));
}

export function formatAmount(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMoney(Math.round(value * 100));
}