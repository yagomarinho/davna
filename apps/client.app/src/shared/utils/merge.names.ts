export function mergeNames(...names: (string | undefined | false)[]): string {
  return names.filter(Boolean).join(' ')
}
