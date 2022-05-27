import { FastifyInstance } from 'fastify'
import { HermesWorker } from '../src/worker'
import { It, Mock, Times } from 'moq.ts'
import { IService } from '../src/common/interfaces/service'

/* eslint-disable no-undef */
describe('Worker', () => {
  it('Can start sub services', async () => {
    const app = new Mock<FastifyInstance>()
      .setup(s => s.listen(It.IsAny(), It.IsAny())).returns(await Promise.resolve())
      .setup(s => s.close()).returns(Promise.resolve(undefined))
    const mockService = new Mock<IService>()
      .setup(x => x.start()).returns(Promise.resolve())
    const service = mockService.object()
    const worker = new HermesWorker([service], app.object())
    await worker.start()
    mockService.verify(s => s.start(), Times.Exactly(1))
  })
  it('Can stop sub services', async () => {
    const app = new Mock<FastifyInstance>()
      .setup(s => s.listen(It.IsAny(), It.IsAny())).returns(await Promise.resolve())
      .setup(s => s.close()).returns(Promise.resolve(undefined))
    const mockService = new Mock<IService>()
      .setup(x => x.start()).returns(Promise.resolve())
      .setup(x => x.stop()).returns(Promise.resolve())
    const service = mockService.object()
    const worker = new HermesWorker([service], app.object())

    await worker.start()
    await worker.stop()
    mockService.verify(s => s.stop(), Times.Exactly(1))
  })
})
