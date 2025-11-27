export interface ConfigDTO {
  auth: {
    jwt: {
      token: {
        headerName: string
        expiresIn: number
      }
      refresh_token: {
        headerName: string
        expiresIn: number
      }
    }
  }
}
