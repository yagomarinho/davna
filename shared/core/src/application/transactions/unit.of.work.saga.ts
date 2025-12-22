/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Entity, Repository } from '@davna/core'
import { UnitOfWork } from './unit.of.work'

export interface Compensation {
  (): any
}

export interface UnitOfWorkSaga extends Pick<UnitOfWork, 'rollback'> {
  readonly registerCompensation: (compensation: Compensation) => any
}

export function UnitOfWorkSaga(): UnitOfWorkSaga {
  const compensations: Compensation[] = []

  const registerCompensation: UnitOfWorkSaga['registerCompensation'] =
    compensation => {
      compensations.push(compensation)
    }

  const rollback: UnitOfWorkSaga['rollback'] = async () => {
    await compensations
      .reverse()
      .reduce(
        (acc, comp) =>
          acc instanceof Promise ? acc.then(() => comp()) : comp(),
        undefined as void | Promise<void>,
      )
  }

  return {
    registerCompensation,
    rollback,
  }
}

export const SagaRepositoryURI = 'saga.repository'
export type SagaRepositoryURI = typeof SagaRepositoryURI

export function SagaRepositoryProxy<E extends Entity>(
  repo: Repository<E>,
  uow: UnitOfWorkSaga,
): Repository<E, SagaRepositoryURI> {
  const get: Repository<E>['methods']['get'] = repo.methods.get
  const query: Repository<E>['methods']['query'] = repo.methods.query

  const set: Repository<E>['methods']['set'] = async entity => {
    const previous = entity.meta ? await get(entity.meta.id) : undefined

    const next = await repo.methods.set(entity)

    uow.registerCompensation(async () => {
      if (previous) await repo.methods.set(previous)
      else await repo.methods.remove(next.meta.id)
    })

    return next
  }

  const remove: Repository<E>['methods']['remove'] = async id => {
    const previous = await get(id)
    if (!previous) return

    uow.registerCompensation(async () => {
      await repo.methods.set(previous)
    })

    await repo.methods.remove(id)
  }

  const batch: Repository<E>['methods']['batch'] = b =>
    // desenvolver primeiro o retorno do batch para identificar quais ID foram criados, atualizados ou removidos
    repo.methods.batch(b)

  const methods = {
    get,
    set,
    remove,
    query,
    batch,
  }
  return {
    _t: repo._t,
    meta: { _r: 'repository', _t: SagaRepositoryURI },
    methods,
  }
}
