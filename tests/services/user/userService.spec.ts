import { UserService } from '../../../src/services/user/userService'
import { fastify } from 'fastify'

/* eslint-disable no-undef */
describe('Services.User', () => {
  it('Can Determine If It Can Serve Traffic', async () => {
    const app = fastify()
    const userService = new UserService(app)
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
    expect(userService.isAlive()).resolves.toBe(true)
  })
})
