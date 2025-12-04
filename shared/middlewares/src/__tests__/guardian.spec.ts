import { isNext, isResponse, Left, Request, Right } from '@davna/core'
import { guardian } from '../guardian'

describe('guardian middleware tests', () => {
  it('should not be able to permit that request forward when the request shape is incorrect', async () => {
    const req = Request.data()
    const errors = ['Invalid Request data', 'Invalid Request Metadata']

    const result = await guardian(req)({ validate: () => Left({ errors }) })

    expect(isResponse(result)).toBeTruthy()
    expect(result).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ errors }),
        metadata: expect.objectContaining({ headers: { status: 400 } }),
      }),
    )
  })

  it('should be able to pass forward the right request', async () => {
    const req = Request.data()
    const result = await guardian(req)({ validate: () => Right(req) })

    expect(isNext(result)).toBeTruthy()
    expect((result as any).request).toStrictEqual(req)
  })
})
