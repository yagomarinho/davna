import { RawProps, Right, Service } from '@davna/core'
import { createUsage, Usage, UsageProps } from '../../entities'
import { ClassroomFedRepository } from '../../repositories'
import { concatenate } from '@davna/kernel'

interface Data {
  usage: Usage
  props: Pick<RawProps<UsageProps>, 'metadata' | 'consumption'>
}

interface Env {
  repository: ClassroomFedRepository
}

export const updateUsage = Service<Data, Env, Usage>(
  ({ usage, props: { metadata, consumption } }) =>
    async ({ repository }) => {
      const updatedUsage = await repository.methods.set<Usage>(
        createUsage(
          concatenate(usage.props, {
            consumption,
            metadata,
          }),
          usage.meta,
        ),
      )

      return Right(updatedUsage)
    },
)
