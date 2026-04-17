const INJECTION_PATTERNS = [
  /^[\s>]*ignore\b/i,
  /^[\s>]*forget\b/i,
  /^[\s>]*disregard\b/i,
  /^[\s>]*override\b/i,
  /^[\s>]*system\s*:/i,
  /^[\s>]*assistant\s*:/i,
  /^[\s>]*user\s*:/i,
  /^[\s>]*instruction\s*:/i,
  /^[\s>]*prompt\s*:/i,
  /^[\s>]*\[system\]/i,
  /^[\s>]*\[inst\]/i,
  /^[\s>]*<<sys>>/i,
  /^[\s>]*<\|system\|>/i,
  /^[\s>]*you are\b/i,
  /^[\s>]*act as\b/i,
  /^[\s>]*roleplay\b/i,
  /^[\s>]*pretend\b/i,
]

const MAX_CELL_LENGTH = 500

function isSuspiciousCell(cell: string): boolean {
  const trimmed = cell.trim()
  if (trimmed.length > MAX_CELL_LENGTH) return true
  return INJECTION_PATTERNS.some((re) => re.test(trimmed))
}

function redactCell(_cell: string): string {
  return "[REDACTED]"
}

export function sanitizeForAI(text: string): string {
  const lines = text.split("\n")
  const sanitized = lines.map((line) => {
    const cells = line.split(/[,;]/)
    const cleaned = cells.map((cell) => {
      const unquoted = cell.trim().replace(/^["']|["']$/g, "")
      return isSuspiciousCell(unquoted) ? redactCell(cell) : cell
    })
    return cleaned.join(line.includes(";") ? ";" : ",")
  })
  return sanitized.join("\n")
}
