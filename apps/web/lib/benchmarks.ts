export const CURRENCY_ZONE = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  CHF: "EUR",
  CAD: "USD",
  AUD: "USD",
  JPY: "JPY",
  NOK: "EUR",
  SEK: "EUR",
  DKK: "EUR",
  NZD: "USD",
  SGD: "USD",
  HKD: "USD",
} as const;

export const BENCHMARKS = {
  EUR: {
    "Food & Drink": 340,
    Transport: 190,
    "Bills & Utilities": 220,
    Entertainment: 75,
    Health: 65,
    Shopping: 130,
    Travel: 85,
  },
  USD: {
    "Food & Drink": 391,
    Transport: 219,
    "Bills & Utilities": 253,
    Entertainment: 86,
    Health: 75,
    Shopping: 150,
    Travel: 98,
  },
  GBP: {
    "Food & Drink": 306,
    Transport: 171,
    "Bills & Utilities": 198,
    Entertainment: 68,
    Health: 59,
    Shopping: 117,
    Travel: 77,
  },
  JPY: {
    "Food & Drink": 45000,
    Transport: 25000,
    "Bills & Utilities": 29000,
    Entertainment: 10000,
    Health: 8600,
    Shopping: 17200,
    Travel: 11200,
  },
} as const;

export type BenchmarkZone = keyof typeof BENCHMARKS
export type BenchmarkCategory = keyof (typeof BENCHMARKS)[BenchmarkZone]

export function getBenchmarks(currency: string): Record<string, number> | null {
  const zone = (CURRENCY_ZONE as Record<string, string>)[currency]
  return zone ? (BENCHMARKS as Record<string, Record<string, number>>)[zone] ?? null : null
}
