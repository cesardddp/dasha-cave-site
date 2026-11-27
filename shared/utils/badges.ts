/**
 * Um post guarda os badges em um único campo de texto; vários badges são
 * separados por espaço. A separação acontece só na leitura/renderização,
 * sem alterar o banco.
 */
export function parseBadges(value?: string | null): string[] {
  if (typeof value !== 'string') return []

  const seen = new Set<string>()
  const badges: string[] = []

  for (const token of value.split(/\s+/)) {
    const badge = token.trim()
    if (!badge || seen.has(badge)) continue
    seen.add(badge)
    badges.push(badge)
  }

  return badges
}
