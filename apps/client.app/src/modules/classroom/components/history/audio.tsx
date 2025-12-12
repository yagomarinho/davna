'use client'

import { useEffect, useState } from 'react'
import { BaseProps } from './base.props'
import { AUDIO_MESSAGE_ROLE } from './audio.message.roles'

interface AudioProps extends BaseProps {
  id: string
}

export const Audio = ({ id, participant }: AudioProps) => {
  const styles = {
    [AUDIO_MESSAGE_ROLE.OTHERS]: {
      backgroundColor: '#202020',
    },
    [AUDIO_MESSAGE_ROLE.OWNER]: {
      backgroundColor: '#2A3345',
    },
  }

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
    <div className="flex flex-row gap-1 items-center justify-center w-full">
      {audioUrl && (
        <audio
          style={styles[participant.role]}
          controls
          crossOrigin=""
          className="w-full"
        >
          <source src={audioUrl} type={'audio/mp4'} />
        </audio>
      )}
    </div>
  )
}
