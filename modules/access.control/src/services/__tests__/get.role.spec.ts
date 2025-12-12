import { isLeft, isRight, Left, Right, Repository } from '@davna/core'
import { InMemoryRepository } from '@davna/repositories'
import { Role } from '../../entities'
import { getRole } from '../get.role'

describe('getRole service', () => {
  const role_id = 'role-1'
  let rolesRepo: Repository<Role>

  beforeEach(() => {
    rolesRepo = InMemoryRepository<Role>()
  })

  it('should return Right when role exists', async () => {
    const role = { id: role_id, name: 'admin' } as Role
    await rolesRepo.set(role)

    const result = await getRole(role_id)({
      roles: rolesRepo,
    })

    expect(isRight(result)).toBeTruthy()
    expect(result).toEqual(expect.objectContaining(Right(role)))
  })

  it('should return Left when role does not exist', async () => {
    const result = await getRole(role_id)({
      roles: rolesRepo,
    })

    expect(isLeft(result)).toBeTruthy()
    expect(result).toEqual(
      expect.objectContaining(
        Left({
          status: 'failed',
          message: `Role not found with id: ${role_id}`,
        }),
      ),
    )
  })
})
