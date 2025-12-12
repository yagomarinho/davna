'use client'

import { useMemo } from 'react'
import { FiCircle, FiPause, FiSend, FiSquare, FiTrash2 } from 'react-icons/fi'

import { useAudioCapture } from '../../contexts'

import { IconButton } from '@/shared/components'

export const RecordState = () => {
  const capture = useAudioCapture()
  const src = useMemo(() => capture.audioUrl, [capture])

  return (
    <div className="flex flex-row gap-2 justify-center items-center w-full">
      <IconButton onClick={capture.remove}>
        <FiTrash2 color="#972B38" size={24} />
      </IconButton>
      {capture.audioUrl && (
        <div className="w-full min-w-40">
          <audio aria-disabled controls crossOrigin="" className="w-full">
            <source src={src} />
          </audio>
        </div>
      )}
      {capture.state !== 'stopped' && (
        <IconButton
          onClick={
            capture.state === 'recording' ? capture.pause : capture.resume
          }
        >
          {capture.state === 'recording' ? (
            <FiPause stroke="none" fill="#FFFFFF" size={24} />
          ) : (
            <FiCircle stroke="none" fill="#972B38" size={24} />
          )}
        </IconButton>
      )}
      <IconButton
        onClick={capture.state === 'stopped' ? capture.send : capture.stop}
      >
        {capture.state === 'stopped' ? (
          <FiSend color="#5A89EF" size={24} />
        ) : (
          <FiSquare stroke="none" fill="#972B38" size={24} />
        )}
      </IconButton>
    </div>
  )
}
