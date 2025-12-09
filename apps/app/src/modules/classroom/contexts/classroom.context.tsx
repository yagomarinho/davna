'use client'

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { io, Socket } from 'socket.io-client'

import { Audio } from '../components'
import { BaseProps } from '../components/history/base.props'
import { getClassroomSession } from '../logic'

import { AUDIO_MESSAGE_ROLE } from '../components/history/audio.message.roles'

import { clientConfig as config } from '@/config'

export enum CONNECTION_STATUS {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}
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
  history: Message[]
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
  tryToReconnect: () => any
  getConnectionStatus: () => CONNECTION_STATUS
  getReconnectionStatus: () => boolean
  history: Audio[]
  replying?: BaseProps
}

export const ClassroomContext = createContext<ClassroomContextProps>(
  {} as ClassroomContextProps,
)

export const ClassroomProvider = ({
  classroom_id,
  children,
}: PropsWithChildren<{ classroom_id: string }>) => {
  const RECONNECTION_ATTEMPTS = 5

  const [remaining, setRemaining] = useState(() => 0)
  const socketRef = useRef<Socket>(null)
  const classroomRef = useRef<Classroom>(null)
  const participantsRef = useRef<Participant[]>([])
  const [retry, setRetry] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS.DISCONNECTED,
  )

  const [history, setHistory] = useState<Audio[]>([])
  const [replying, setReplying] = useState<BaseProps>()

  const reconnectionStatus = useMemo(
    () => retry >= RECONNECTION_ATTEMPTS,
    [retry],
  )

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

  const getConnectionStatus = useCallback(
    () => connectionStatus,
    [connectionStatus],
  )

  const getReconnectionStatus = useCallback(
    () => reconnectionStatus,
    [reconnectionStatus],
  )

  const tryToReconnect = useCallback(() => {
    const s = socketRef.current
    if (s) {
      setRetry(0)
      setConnectionStatus(CONNECTION_STATUS.CONNECTING)
      s.connect()
      s.once('connect', () => s.emit('classroom:welcome'))
    }
  }, [])

  useEffect(() => {
    async function startClassroom() {
      setConnectionStatus(CONNECTION_STATUS.CONNECTING)
      const token = await getClassroomSession()

      socketRef.current = io(config.api.wsBaseUrl, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnectionAttempts: RECONNECTION_ATTEMPTS,
        auth: {
          token,
          classroom_id,
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
          setHistory(
            classroom.history.map(message => ({
              id: message.id,
              audio_id: message.data.id,
              participant: {
                participant_id: message.data.owner_id,
                name: message.data.owner_id === 'agent' ? 'Teacher' : 'You',
                role:
                  participantsRef.current.find(
                    p => p.participant_id === message.data.owner_id,
                  )?.role === 'student'
                    ? 'owner'
                    : 'others',
              },
              transcription: '',
              translation: '',
            })),
          )

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

      s.on('connect', async () => {
        setRetry(0)
        setConnectionStatus(CONNECTION_STATUS.CONNECTED)
        socketRef.current?.emit('classroom:welcome')
      })

      s.on('connect_error', () => {
        setRetry(n => {
          if (n >= RECONNECTION_ATTEMPTS - 1) {
            s.disconnect()
          }

          return ++n
        })
      })

      function disconnect() {
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED)
      }

      s.on('error', disconnect)
      s.on('error:service', disconnect)
      s.on('error:internal', disconnect)
      s.on('connect_error', disconnect)
    }

    startClassroom()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroom_id])

  return (
    <ClassroomContext.Provider
      value={{
        setRemaining: set,
        getRemaining,
        emitMessage,
        getConnectionStatus,
        getReconnectionStatus,
        tryToReconnect,
        history,
        replying,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  )
}

export const useClassroom = () => useContext(ClassroomContext)
