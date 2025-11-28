import { Middleware, Next, Response } from '@davna/core'

interface Env {
  config: {
    auth: {
      apiKey: {
        headerName: string
        key: string
      }
    }
  }
}

export const apiKeyAuthorization = Middleware(
  request =>
    async ({ config }: Env): Promise<any> => {
      const auth = request.metadata.headers[config.auth.apiKey.headerName] as
        | string
        | undefined

      if (!auth)
        return Response({
          data: { message: 'API Access Token is missing' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      const [, token] = auth.split('=')

      if (!token)
        return Response({
          data: { message: 'API Access Token is missing' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      if (token !== config.auth.apiKey.key)
        return Response({
          data: { message: 'API Access Token is invalid' },
          metadata: {
            headers: {
              status: 401,
            },
          },
        })

      return Next({ request })
    },
)
