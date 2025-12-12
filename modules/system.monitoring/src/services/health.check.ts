import { Right, Service } from '@davna/core'

export const healthCheck = Service(() => () => Right({ healthy: true }))
