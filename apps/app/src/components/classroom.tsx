/* eslint-disable no-console */
'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

import { useClassroom } from '@/contexts/classroom.context'

import { Audio, AudioChat } from './audio.chat'
import { AudioCapture } from './audio.capture'
import { AUDIO_MESSAGE_ROLE } from './audio.chat/audio.message.roles'
import { Replying } from './audio.chat/replying'

import config from '@/config'

interface Participant {
  participant_id: string
  role: AUDIO_MESSAGE_ROLE
}

interface ReplyingMessage {
  classroom_id: string
  participant_id: string
}

interface Classroom {
  id: string
  history: string[]
  participants: Participant[]
}

interface Message {
  id: string
  classroom_id: string
  transcription: string
  translation: string
  data: {
    id: string
    owner_id: string
    src: string
  }
}

interface Started {
  classroom: Classroom
  remainingConsumption: number
}

interface Updated extends Started {
  message: Message
}

export const Classroom = () => {
  const socketRef = useRef<Socket>(null)
  const classroomRef = useRef<Classroom>(null)
  const participantsRef = useRef<Participant[]>([])
  const { setRemaining } = useClassroom()

  const [audios, setAudios] = useState<Audio[]>([])
  const [replying, setReplying] = useState<Replying>()

  async function getClassroomSession(): Promise<string> {
    const response = await fetch('/api/classroom/session')

    if (!response.ok) throw new Error('Invalid Result')

    const { token } = await response.json()

    return token
  }

  useEffect(() => {
    async function startClassroom() {
      const token = await getClassroomSession()

      socketRef.current = io(config.api.wsBaseUrl, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnectionAttempts: 5,
        auth: {
          token,
        },
        autoConnect: true,
      })

      const s = socketRef.current

      s.on(
        'classroom:started',
        ({ classroom, remainingConsumption }: Started) => {
          classroomRef.current = classroom
          participantsRef.current = classroom.participants

          setRemaining(remainingConsumption)

          // recuperar o histórico quando for possível reiniciar uma conversa já iniciada
        },
      )

      s.on(
        'classroom:updated',
        ({ classroom, message, remainingConsumption }: Updated) => {
          // comparar para ver se a mensagem pertence a classroom correta
          if (classroom.id !== classroomRef.current?.id) return

          const role = participantsRef.current.find(
            participant => participant.participant_id === message.data.owner_id,
          )?.role

          if (!role) return

          const exists = audios.find(audio => audio.id === message.id)

          if (exists) return

          setReplying(undefined)
          setRemaining(remainingConsumption)

          const audio: Audio = {
            id: message.id,
            role,
            audio_id: message.data.id,
            transcription: message.transcription,
            translation: message.translation,
          }

          setAudios(previous => [...previous, audio])
        },
      )

      s.on('classroom:replying', (message: ReplyingMessage) => {
        if (message.classroom_id !== classroomRef.current?.id) return

        const role = classroomRef.current?.participants.find(
          p => p.participant_id === message.participant_id,
        )?.role

        if (!role) return

        setReplying({ role })
      })

      s.on('error:service', err => {
        console.error('service error', err)
      })

      s.on('error:internal', err => {
        console.error('internal error', err)
      })

      s.on('connect_error', err => {
        console.error('connect_error', err)
      })
    }

    startClassroom()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return (
    <main className="flex flex-col items-center w-full">
      <div className="flex flex-col gap-3 justify-start items-center w-full max-w-screen-md p-4 md:p-8">
        <AudioChat messages={audios} />
        <Replying replying={replying} />
      </div>
      <footer>
        <AudioCapture
          afterUpload={audio => {
            const s = socketRef.current

            const student = participantsRef.current.find(
              p => p.role === 'student',
            )

            s?.emit('classroom:append-message', {
              classroom_id: classroomRef.current?.id,
              participant_id: student?.participant_id,
              type: 'audio',
              data: audio,
            })
          }}
        />
      </footer>
    </main>
  )
}
