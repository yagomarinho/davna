/* eslint-disable no-console */
'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Audio {
  id: string
  owner_id: string
  name: string
  mime: string
  src: string
  duration: number
  internal_ref: {
    identifier: string
    storage: string
  }
  created_at: Date
  updated_at: Date
}

interface AudioCapture {
  afterUpload?: (audio: Audio) => any
}

export const AudioCapture = ({ afterUpload }: AudioCapture) => {
  const mediaRecorderRef = useRef<MediaRecorder>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream>(null)
  const startTsRef = useRef(0)
  // eslint-disable-next-line no-undef
  const timerRef = useRef<NodeJS.Timeout>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string>()
  const [mimeType, setMimeType] = useState('audio/webm')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(
    () => () => {
      stopStream()
      if (timerRef.current !== null) clearInterval(timerRef.current)
      revokeAudioUrl()
    },
    [],
  )

  function revokeAudioUrl() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(undefined)
    }
  }

  async function startRecording() {
    try {
      revokeAudioUrl()
      // Prefer a supported mimeType for MediaRecorder
      const preferred = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
      ]
      const supported =
        preferred.find(
          t =>
            MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t),
        ) || 'audio/webm'
      setMimeType(supported)

      const constraints = { audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, { mimeType: supported })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        // reset chunks for next recording
        chunksRef.current = []
      }

      mediaRecorder.start()
      startTsRef.current = Date.now()
      setIsRecording(true)
      setIsPaused(false)
      setSeconds(0)

      // timer
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTsRef.current) / 1000))
      }, 250)
    } catch (err) {
      console.error('Erro ao iniciar gravação', err)
      alert('Não foi possível acessar o microfone. Verifique permissões.')
    }
  }

  function pauseResumeRecording() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    if (recorder.state === 'recording') {
      recorder.pause()
      setIsPaused(true)
      // stop timer but keep current seconds
      if (timerRef.current) clearInterval(timerRef.current)
    } else if (recorder.state === 'paused') {
      recorder.resume()
      setIsPaused(false)
      // resume timer with an offset
      startTsRef.current = Date.now() - seconds * 1000
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTsRef.current) / 1000))
      }, 250)
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current

    if (!recorder) return

    if (recorder.state === 'recording' || recorder.state === 'paused') {
      recorder.stop()
    }

    setIsRecording(false)
    setIsPaused(false)
    if (timerRef.current !== null) clearInterval(timerRef.current)
    stopStream()
  }

  async function downloadRecording() {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `recording.${guessExtensionFromMime(mimeType)}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function guessExtensionFromMime(mime) {
    if (!mime) return 'webm'
    if (mime.includes('webm')) return 'webm'
    if (mime.includes('ogg')) return 'ogg'
    if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3'
    return 'bin'
  }

  async function uploadRecording() {
    if (!audioUrl) return
    setIsUploading(true)
    try {
      // fetch the Blob from the object URL
      const blob = await (await fetch(audioUrl)).blob()
      // convert to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer()
      // prepare metadata header
      const filename = `rec${new Date().toISOString()}${guessExtensionFromMime(mimeType)}`

      const file = new File([arrayBuffer], filename, { type: mimeType })

      const formData = new FormData()

      formData.append('file', file)

      // send raw bytes to your endpoint (example: /api/upload-audio)
      const res = await fetch('/api/classroom/audio/upload', {
        method: 'POST',
        headers: {
          'X-Duration': (seconds * 1000).toString(),
        },
        body: formData,
      })

      if (!res.ok) throw new Error('Failed Upload')
      const audio = await res.json()

      afterUpload?.(audio)
    } catch (err: any) {
      console.error(err)
      alert('Erro ao enviar: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded-2xl shadow-md">
      <h3 className="text-lg font-semibold mb-3">Captura de Áudio</h3>

      <div className="flex gap-2 items-center mb-3">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="px-3 py-2 rounded-lg bg-green-500 text-white disabled:opacity-50"
        >
          Gravar
        </button>

        <button
          onClick={pauseResumeRecording}
          disabled={!isRecording}
          className="px-3 py-2 rounded-lg bg-yellow-500 text-white disabled:opacity-50"
        >
          {isPaused ? 'Retomar' : 'Pausar'}
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-3 py-2 rounded-lg bg-red-500 text-white disabled:opacity-50"
        >
          Parar
        </button>
      </div>

      <div className="mb-3">
        <strong>Tempo:</strong> {formatTime(seconds)}
        <span className="ml-3 text-sm text-gray-500">
          {isRecording ? (isPaused ? ' (pausado)' : ' (gravando)') : ''}
        </span>
      </div>

      {audioUrl ? (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full" />

          <div className="flex gap-2">
            <button
              onClick={downloadRecording}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white"
            >
              Baixar
            </button>
            <button
              onClick={uploadRecording}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white"
              disabled={isUploading}
            >
              {isUploading ? 'Enviando...' : 'Enviar para servidor'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Nenhuma gravação disponível ainda.
        </div>
      )}
    </div>
  )
}

// helpers
function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
