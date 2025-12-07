import { RecordState } from './record.state'

export interface CaptureRecordingProps {
  state: 'paused' | 'recording' | 'stopped'
}

export const CaptureRecording = ({ state }: CaptureRecordingProps) => (
  <div className="flex flex-col gap-4 items-center justify-center">
    <span className="font-grotesk text- text-white text-xs">
      {state === 'recording' ? 'Gravando...' : 'Pausado'}
    </span>
    <RecordState />
  </div>
)
