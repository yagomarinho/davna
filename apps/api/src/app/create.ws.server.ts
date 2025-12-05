/* eslint-disable no-console */
import type { Server as HTTPServer } from 'node:http'
import { Server } from 'socket.io'

import { isLeft, Request } from '@davna/core'
import { verifyWebsocketAuth } from '@davna/account'
import {
  appendAndReplyHandler,
  initializeClassroomHandler,
} from '@davna/classroom'

import { Env } from './env'

export function createWsServer(server: HTTPServer, env: Env) {
  const io = new Server(server)

  io.use(verifyWebsocketAuth(env))

  const {
    repositories: { audios, classrooms, messages },
    providers: { gpt, messageHandler, multimedia, storage },
    constants: { tempDir, config },
  } = env

  const storage_driver = config.providers.storage.default_driver

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
        storage_driver,
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
          storage_driver,
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

    // Manter por enquanto como comentário, mais tarde usar essa função para realizar
    // outras ações importantes
    //
    // socket.on('disconnect', reason => {
    //   console.log('logout:', socket.id, reason)
    // })
  })

  return server
}
