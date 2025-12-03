import { Server } from 'node:http'

export function connect({
  server,
  port,
}: {
  server: Server
  port: number
}): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve()
    })

    server.on('error', err => reject(err))
  })
}
