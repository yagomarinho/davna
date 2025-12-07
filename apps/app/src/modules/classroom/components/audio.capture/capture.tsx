'use client'

import { useAudioCapture } from '../../contexts'

import { RecordButton } from './record.button'
import { CaptureRecording } from './capture.recording'

export const Capture = () => {
  const { state } = useAudioCapture()

  return state === 'ready' ? (
    <RecordButton />
  ) : (
    <CaptureRecording state={state} />
  )
}
