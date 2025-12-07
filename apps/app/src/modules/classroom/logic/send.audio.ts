export async function sendAudio(url: string, mime: string) {
  // fetch the Blob from the object URL
  const blob = await (await fetch(url)).blob()
  // convert to ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer()
  // prepare metadata header
  const filename = `rec${new Date().toISOString()}`

  const file = new File([arrayBuffer], filename, { type: mime })

  const formData = new FormData()

  formData.append('file', file)

  // send raw bytes to your endpoint (example: /api/upload-audio)
  const res = await fetch('/api/classroom/audio/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Failed Upload')
  return res.json()
}
