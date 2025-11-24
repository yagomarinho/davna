/* eslint-disable no-console */
'use client'

import { useEffect, useRef, useState } from 'react'
import { Audio, AudioChat } from './audio.chat'
import { io } from 'socket.io-client'
import { Socket } from 'socket.io-client'
import { AudioCapture } from './audio.capture'
import config from '@/config'

interface Participant {
  participant_id: string
  role: 'student' | 'teacher'
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

interface Update {
  classroom: Classroom
  message: Message
}

export const Classroom = () => {
  const socketRef = useRef<Socket>(null)
  const classroomIdRef = useRef('')
  const participantsRef = useRef<Participant[]>([])

  const [audios, setAudios] = useState<Audio[]>([])

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

      s.on('classroom:started', (classroom: Classroom) => {
        classroomIdRef.current = classroom.id
        participantsRef.current = classroom.participants

        // recuperar o histórico quando for possível reiniciar uma conversa já iniciada
      })

      s.on('classroom:updated', ({ classroom, message }: Update) => {
        // comparar para ver se a mensagem pertence a classroom correta
        if (classroom.id !== classroomIdRef.current) return

        const role = participantsRef.current.find(
          participant => participant.participant_id === message.data.owner_id,
        )?.role

        if (!role) return

        const exists = audios.find(audio => audio.id === message.id)

        if (exists) return

        const audio: Audio = {
          id: message.id,
          role,
          audio_id: message.data.id,
          transcription: message.transcription,
          translation: message.translation,
        }

        setAudios(previous => [...previous, audio])
      })

      s.on('classroom:replying', msg => {
        console.log(msg)
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
      <div className="flex justify-center w-full max-w-screen-md p-4 md:p-8">
        <AudioChat messages={audios} />
      </div>
      <footer>
        <AudioCapture
          afterUpload={audio => {
            const s = socketRef.current

            const student = participantsRef.current.find(
              p => p.role === 'student',
            )

            s?.emit('classroom:append-message', {
              classroom_id: classroomIdRef.current,
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
