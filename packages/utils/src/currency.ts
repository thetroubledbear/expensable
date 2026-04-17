export function formatCurrency(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
}

export function parseCurrencyString(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, ""))
}
