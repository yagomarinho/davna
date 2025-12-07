'use client'

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Recorder, startRecorder } from '../logic/start.recorder'
import { sendAudio } from '../logic'
import { useClassroom } from './classroom.context'

interface AudioCaptureContext {
  state: 'ready' | 'recording' | 'paused' | 'stopped'
  audioUrl: string
  resume: () => any
  pause: () => any
  stop: () => any
  remove: () => any
  send: () => any
  start: () => any
}

export const AudioCaptureContext = createContext<AudioCaptureContext>(
  {} as AudioCaptureContext,
)

export const AudioCaptureProvider = ({ children }: PropsWithChildren<{}>) => {
  const { emitMessage } = useClassroom()

  const recorderRef = useRef<Recorder>(null)
  const chunksRef = useRef<Blob[]>([])
  const [state, setState] = useState<AudioCaptureContext['state']>('ready')
  const [audioUrl, setAudioUrl] = useState('')

  const setUrl = useCallback(() => {
    if (!chunksRef.current.length) {
      return setAudioUrl('')
    }

    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current!.mime,
    })

    const url = URL.createObjectURL(blob)

    setAudioUrl(url)
  }, [recorderRef, chunksRef])

  const start = useCallback(async () => {
    if (!recorderRef.current && state === 'ready') {
      setState('recording')

      recorderRef.current = await startRecorder(chunk => {
        chunksRef.current.push(chunk)
      })
    }
  }, [recorderRef, state])

  const resume = useCallback(() => {
    if (recorderRef.current && state === 'paused') {
      setAudioUrl('')
      setState('recording')
      recorderRef.current.resume()
    }
  }, [recorderRef, state])

  const pause = useCallback(() => {
    if (recorderRef.current && state === 'recording') {
      setUrl()
      setState('paused')
      recorderRef.current.pause()
    }
  }, [recorderRef, state])

  const stop = useCallback(() => {
    if (recorderRef.current && ['recording', 'paused'].includes(state)) {
      setState('stopped')
      recorderRef.current.stop()
      setUrl()
    }
  }, [recorderRef, state])

  const remove = useCallback(() => {
    if (recorderRef.current && state !== 'ready') {
      if (state !== 'stopped') recorderRef.current.stop()
      setState('ready')
      setAudioUrl('')
      chunksRef.current = []
      recorderRef.current = null
    }
  }, [chunksRef, state])

  const send = useCallback(async () => {
    if (!audioUrl) return

    const audio = await sendAudio(audioUrl, recorderRef.current!.mime)

    emitMessage(audio)
    remove()
  }, [recorderRef, audioUrl])

  const ctx = useMemo(
    () => ({ state, audioUrl, resume, pause, remove, send, start, stop }),
    [state, audioUrl, resume, pause, remove, send, start, stop],
  )

  return (
    <AudioCaptureContext.Provider value={ctx}>
      {children}
    </AudioCaptureContext.Provider>
  )
}

export const useAudioCapture = () => useContext(AudioCaptureContext)
