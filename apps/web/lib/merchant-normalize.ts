const STRIP_PATTERNS: RegExp[] = [
  /\s*#\s*\d+\s*/g,                                   // store numbers: "STARBUCKS #1234"
  /\s+\d{5,}\s*/g,                                    // long digit codes
  /\s*(INC|LLC|LTD|CO|CORP|NV|SA|SAS|BV|GMBH|PLC)\.?\s*$/i,
  /\bwww\.\s*/i,
  /\.com\b/i,
  /\*/g,
  /\s+[A-Z]{2}\s*$/,                                  // trailing state/country codes
]

export function normalizeMerchant(raw: string | null | undefined): string | null {
  if (!raw) return null
  let name = raw.trim()
  for (const pat of STRIP_PATTERNS) name = name.replace(pat, " ")
  name = name.replace(/\s+/g, " ").trim()
  if (!name) return raw.trim()
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}
