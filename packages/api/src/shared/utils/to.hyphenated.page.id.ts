export function toHyphenatedPageId(id: string): string {
  if (!id) return ''

  const clean = id.replace(/-/g, '')

  if (clean.length !== 32) {
    throw new Error(`ID inválido: ${id}`)
  }

  return [
    clean.substring(0, 8),
    clean.substring(8, 12),
    clean.substring(12, 16),
    clean.substring(16, 20),
    clean.substring(20),
  ].join('-')
}
