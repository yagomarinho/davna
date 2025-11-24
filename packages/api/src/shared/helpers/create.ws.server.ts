/* eslint-disable no-console */
import type { Server as HTTPServer } from 'node:http'
import { Server } from 'socket.io'
import { verifyWebsocketAuth } from '../middlewares/verify.websocket.auth'
import { Env } from '../../env'
import { initializeClassroomHandler } from '../../modules/classroom/handlers/initialize.classroom.handler'
import { appendAndReplyHandler } from '../../modules/classroom/handlers/append.and.reply.handler'
import { Request } from '../core/request'
import { isLeft } from '../core/either'

export function createWsServer(server: HTTPServer, env: Env) {
  const io = new Server(server)

  io.use(verifyWebsocketAuth(env))

  const {
    repositories: { audios, classrooms, messages },
    providers: { messageHandler, storage },
  } = env

  io.on('connection', async socket => {
    const { account } = socket.data

    try {
      const initializeResult = await initializeClassroomHandler(
        Request.metadata({ account }),
      )({
        emitter: socket,
        audios,
        classrooms,
        messages,
        messageHandler,
        storage,
      })

      if (isLeft(initializeResult)) {
        return socket.disconnect(true)
      }
    } catch (e) {
      console.error(e)
      socket.emit('error:internal', {
        status: 'error',
        message: 'Internal Server Error',
      })
      return socket.disconnect(true)
    }

    // Receber evento do cliente
    socket.on('classroom:append-message', async data => {
      try {
        const appendResult = await appendAndReplyHandler(
          Request({
            data,
            metadata: { account },
          }),
        )({
          emitter: socket,
          audios,
          classrooms,
          messageHandler,
          messages,
          storage,
        })

        if (isLeft(appendResult)) return socket.disconnect(true)
      } catch (e) {
        console.error(e)
        socket.emit('error:internal', {
          status: 'error',
          message: 'Internal Server Error',
        })
        return socket.disconnect(true)
      }
    })

    socket.on('disconnect', reason => {
      console.log('logout:', socket.id, reason)
    })
  })

  return server
}
