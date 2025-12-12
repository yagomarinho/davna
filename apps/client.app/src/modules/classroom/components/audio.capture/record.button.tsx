'use client'

import { FiMic } from 'react-icons/fi'

import { useAudioCapture } from '../../contexts'

export const RecordButton = () => {
  const capture = useAudioCapture()

  return (
    <button
      onClick={capture.start}
      className="flex items-center justify-center w-14 h-14 shadow-[4px_4px_8px_rgba(0,0,0,0.5)] rounded-full bg-[#303030] border border-[#5A89EF]/15"
    >
      <FiMic color="#5A89EF" size={24} />
    </button>
  )
}
