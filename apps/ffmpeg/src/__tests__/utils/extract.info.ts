export function extractInfo(res) {
  const contentDisposition = res.headers['content-disposition'] ?? ''

  const filenameMatch = contentDisposition.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
  )

  return {
    name: filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : null,
    mime: res.headers['content-type'],
    codec: res.headers['x-file-codec'],
    duration: parseFloat(res.headers['x-file-duration'] ?? 0),
    format: res.headers['x-file-format'],
  }
}
