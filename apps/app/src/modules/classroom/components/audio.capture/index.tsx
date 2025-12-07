import { CaptureBase } from './base'

import { Capture } from './capture'

import { AudioCaptureProvider } from '../../contexts/audio.capture.context'

export const AudioCapture = () => (
  <CaptureBase>
    <AudioCaptureProvider>
      <Capture />
    </AudioCaptureProvider>
  </CaptureBase>
)
