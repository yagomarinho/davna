/* eslint-disable no-console */
'use client'

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { io, Socket } from 'socket.io-client'

import { Audio } from '../components'
import { BaseProps } from '../components/history/base.props'
import { getClassroomSession } from '../logic'

import { AUDIO_MESSAGE_ROLE } from '../components/history/audio.message.roles'

import config from '@/config'

interface Participant {
  participant_id: string
  role: 'teacher' | 'student'
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

export interface ClassroomContextProps {
  setRemaining: (remainingConsumption: number) => void
  getRemaining: () => number
  emitMessage: (audio: Audio) => any
  history: Audio[]
  replying?: BaseProps
}

export const ClassroomContext = createContext<ClassroomContextProps>(
  {} as ClassroomContextProps,
)

export const ClassroomProvider = ({ children }: PropsWithChildren<{}>) => {
  const [remaining, setRemaining] = useState(() => 0)
  const socketRef = useRef<Socket>(null)
  const classroomRef = useRef<Classroom>(null)
  const participantsRef = useRef<Participant[]>([])

  const [history, setHistory] = useState<Audio[]>([])
  const [replying, setReplying] = useState<BaseProps>()

  const set = useCallback((consumption: number) => {
    setRemaining(consumption)
  }, [])

  const getRemaining = useCallback(() => remaining, [remaining])

  const emitMessage = useCallback(
    audio => {
      const s = socketRef.current

      const student = participantsRef.current.find(p => p.role === 'student')

      s?.emit('classroom:append-message', {
        classroom_id: classroomRef.current?.id,
        participant_id: student?.participant_id,
        type: 'audio',
        data: audio,
      })
    },
    [socketRef, participantsRef],
  )

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

          const participant = participantsRef.current.find(
            participant => participant.participant_id === message.data.owner_id,
          )

          if (!participant) return

          const exists = history.find(audio => audio.id === message.id)

          if (exists) return

          setReplying(undefined)
          setRemaining(remainingConsumption)

          const isTeacher = participant.role === 'teacher'

          const audio: Audio = {
            id: message.id,
            audio_id: message.data.id,
            participant: {
              name: isTeacher ? 'Teacher' : 'You',
              participant_id: participant.role,
              role: isTeacher
                ? AUDIO_MESSAGE_ROLE.OTHERS
                : AUDIO_MESSAGE_ROLE.OWNER,
            },
            transcription: message.transcription,
            translation: message.translation,
          }

          setHistory(previous => [...previous, audio])
        },
      )

      s.on('classroom:replying', (message: ReplyingMessage) => {
        if (message.classroom_id !== classroomRef.current?.id) return

        const participant = classroomRef.current?.participants.find(
          p => p.participant_id === message.participant_id,
        )

        if (!participant) return

        const isTeacher = participant.role === 'teacher'

        setReplying({
          participant: {
            participant_id: participant.participant_id,
            role: isTeacher
              ? AUDIO_MESSAGE_ROLE.OTHERS
              : AUDIO_MESSAGE_ROLE.OWNER,
            name: isTeacher ? 'Teacher' : 'You',
          },
        })
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
    <ClassroomContext.Provider
      value={{
        setRemaining: set,
        getRemaining,
        emitMessage,
        history,
        replying,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  )
}

export const useClassroom = () => useContext(ClassroomContext)
