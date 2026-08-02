export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("he-IL").format(value);
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatCurrencyOrDash(value: number | null): string {
  if (value === null) return "—";
  return formatCurrency(value);
}
