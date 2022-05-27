import { UserService } from '../../../src/services/user/userService'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { fastify } from 'fastify'

/* eslint-disable no-undef */
describe('Services.User', () => {
  jest.setTimeout(60000)

  let mongoContainer: StartedTestContainer
  beforeAll(async () => {
    mongoContainer = await new GenericContainer('mongo:4.2.1').start()
  })
  afterAll(async () => {
    await mongoContainer.stop()
  })
  it('Can Determine If It Can Serve Traffic', async () => {
    const app = fastify()
    const userService = new UserService(app)
    await userService.start()
    const canServe = await userService.canServeTraffic()
    expect(canServe).toBe(true)
  })
  it('Can Start', async () => {
    const app = fastify()
    const userService = new UserService(app)
    await userService.start()
    expect(userService.isAlive()).resolves.toBe(true)
  })
  it('Can Stop', async () => {
    const app = fastify()
    const userService = new UserService(app)
    await userService.start()
    await userService.stop()
    expect(userService.isAlive()).resolves.toBe(false)
  })
  it('Serves Traffic', async () => {
    const app = fastify()
    const userService = new UserService(app)
    expect(userService.servesTraffic()).toBe(true)
  })
  it('Can Be Destroyed', async () => {
    const app = fastify()
    const userService = new UserService(app)
    await userService.start()
    await userService.destroy()
    expect(userService.isAlive()).resolves.toBe(false)
  })
  it('Can Determine Its Alive', async () => {
    const app = fastify()
    const userService = new UserService(app)
    expect(userService.isAlive()).resolves.toBe(false)
    await userService.start()
    expect(userService.isAlive()).resolves.toBe(true)
  })
})
