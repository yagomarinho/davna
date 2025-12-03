import { Socket } from 'socket.io-client'

export function waitFor<T>(
  socket: Socket | Promise<Socket>,
  event: string,
): Promise<T> {
  return new Promise(resolve => {
    if (socket instanceof Promise) {
      return socket.then(s => s.once(event, resolve))
    }

    return socket.once(event, resolve)
  })
}
