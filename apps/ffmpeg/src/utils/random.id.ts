export function randomId() {
  return Array.from({ length: 10 }, () => Math.round(Math.random() * 10)).join(
    '',
  )
}
