import { Socket } from 'socket.io-client'

export function waitFor<T>(socket: Socket, event: string): Promise<T> {
  return new Promise(resolve => socket.once(event, resolve))
}
