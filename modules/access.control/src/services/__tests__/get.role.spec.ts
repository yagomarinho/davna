import { isLeft, isRight, Left, Repository, EntityContext } from '@davna/core'
import { InMemoryRepository } from '@davna/infra'
import { createRole, Role } from '../../entities'
import { getRole } from '../get.role'

describe('getRole service', () => {
  const role_id = 'role-1'
  let rolesRepo: Repository<Role>

  const entityContext = {
    declareEntity: jest.fn(),
  } as any as jest.Mocked<EntityContext>

  beforeEach(() => {
    rolesRepo = InMemoryRepository<Role>({ entityContext })
    jest.clearAllMocks()
  })

  it('should return Right when role exists', async () => {
    entityContext.declareEntity.mockImplementationOnce(entity =>
      entity._b(entity.props, {
        id: role_id,
        _r: 'entity',
        created_at: new Date(),
        updated_at: new Date(),
        _idempotency_key: '',
      }),
    )

    const role = createRole({
      name: 'admin',
      description: 'This role is only for admins',
    })

    await rolesRepo.methods.set(role, '')

    const result = await getRole(role_id)({
      roles: rolesRepo,
    })

    expect(isRight(result)).toBeTruthy()
    const { value } = result

    expect(value).toEqual(
      expect.objectContaining({
        props: role.props,
      }),
    )
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
