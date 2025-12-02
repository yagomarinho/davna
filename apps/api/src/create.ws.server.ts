/* eslint-disable no-console */
import type { Server as HTTPServer } from 'node:http'
import { Server } from 'socket.io'

import { isLeft, Request } from '@davna/core'

import { Env } from './env'
import { verifyWebsocketAuth } from '@davna/account'
import {
  appendAndReplyHandler,
  initializeClassroomHandler,
} from '@davna/classroom'

export function createWsServer(server: HTTPServer, env: Env) {
  const io = new Server(server)

  io.use(verifyWebsocketAuth(env))

  const {
    repositories: { audios, classrooms, messages },
    providers: { gpt, messageHandler, multimedia, storage },
    constants: { tempDir },
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
        gpt,
        messages,
        multimedia,
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
          messages,
          gpt,
          multimedia,
          messageHandler,
          storage,
          tempDir,
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
