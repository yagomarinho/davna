/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Recorder {
  mime: string
  stop: () => any
  pause: () => any
  resume: () => any
}

export async function startRecorder(
  fn: (chunk: Blob) => any,
): Promise<Recorder> {
  const preferred = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
  ]

  const supported =
    preferred.find(
      t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t),
    ) || 'audio/webm'

  const constraints = { audio: true }
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  const mediaRecorder = new MediaRecorder(stream, { mimeType: supported })

  mediaRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) fn(e.data)
  }

  let intervalId: number | null = null

  function requestData() {
    if (intervalId == null) {
      intervalId = window.setInterval(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          try {
            mediaRecorder.requestData()
            // eslint-disable-next-line no-empty
          } catch {}
        }
      }, 250)
    }
  }

  function stopRequestData() {
    if (intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  mediaRecorder.onstart = requestData
  mediaRecorder.onresume = requestData
  mediaRecorder.onpause = stopRequestData
  mediaRecorder.onstop = stopRequestData

  const stop = () => {
    if (mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    stream.getTracks().forEach(t => t.stop())
    mediaRecorder.ondataavailable = null
    mediaRecorder.onerror = null
    mediaRecorder.onstart = null
    mediaRecorder.onstop = null
    mediaRecorder.onpause = null
    mediaRecorder.onresume = null
  }

  const pause = () => {
    if (mediaRecorder.state === 'recording') mediaRecorder.pause()
  }

  const resume = () => {
    if (mediaRecorder.state === 'paused') {
      mediaRecorder.resume()
    }
  }

  mediaRecorder.start()

  return {
    mime: supported,
    stop,
    pause,
    resume,
  }
}
