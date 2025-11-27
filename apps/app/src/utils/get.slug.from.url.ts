export function getSlugFromUrl(url: string): string | undefined {
  const paths = url.split('/').filter(Boolean)

  return paths[paths.length - 1]
}
