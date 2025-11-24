'use client'

import { useEffect, useState } from 'react'

interface AudioProps {
  id: string
}

export const Audio = ({ id }: AudioProps) => {
  const [audioUrl, setAudioUrl] = useState<string>()

  async function getAudio(audio_id: string) {
    const resp = await fetch(`/api/classroom/audio/download/${audio_id}`)

    if (!resp.ok) throw new Error('Invalid audio id')

    const blob = await resp.blob()

    return blob
  }

  useEffect(() => {
    getAudio(id).then(blob => {
      const url = URL.createObjectURL(blob)

      setAudioUrl(url)
    })
  }, [id])

  return (
    <div className="flex flex-row gap-1 items-center justify-center">
      {audioUrl && (
        <audio controls crossOrigin="" src={audioUrl} className="w-full" />
      )}
    </div>
  )
}
