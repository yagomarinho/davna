import {
  Handler,
  Identifiable,
  isLeft,
  Response,
  SagaRepositoryProxy,
  UnitOfWorkSaga,
} from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import { USAGE_UNITS } from '../entities'
import { authorizeConsumption } from '../services/authorize.consumption'
import { Storage } from '@davna/infra'
import { createPresignedAudio } from '../services/create.presigned.audio'

interface Metadata {
  account: Identifiable
}

interface Data {
  duration: {
    unit: USAGE_UNITS.SECONDS
    value: number
  } // Já receber o duration in seconds
}

interface Env {
  repository: ClassroomFedRepository
  storage: Storage
}

export const reserveConsumptionHandler = Handler<Env, Data, Metadata>(
  request => async env => {
    const owner_id = request.metadata.account.id
    const { duration } = request.data
    const { storage } = env

    const authorizedResult = await authorizeConsumption({
      owner_id,
      requested_consumption: duration.value,
    })({ repository: env.repository })

    if (isLeft(authorizedResult))
      return Response({
        metadata: { headers: { status: 401 } },
        data: { message: 'Has no consumption left. Try again later' },
      })

    const uow = UnitOfWorkSaga()
    try {
      const repository = SagaRepositoryProxy(env.repository, uow)
      const createAudioResult = await createPresignedAudio({
        duration,
        owner_id,
      })({
        repository,
        storage,
      })

      if (isLeft(createAudioResult)) throw new Error('Invalid result')

      return Response.data({})
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e)

      await uow.rollback()

      return Response({
        metadata: { headers: { status: 500 } },
        data: { message: 'Internal server error' },
      })
    }
  },
)
