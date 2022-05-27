import { IdentityService } from '../../../src/services/identity/identityService'
import { fastify } from 'fastify'

/* eslint-disable no-undef */
describe('Services.Identity', () => {
  it('Can Determine If It Can Serve Traffic', async () => {
    const app = fastify()
    const identityService = new IdentityService(app)
    await identityService.start()
    const canServe = await identityService.canServeTraffic()
    expect(canServe).toBe(true)
  })
  it('Can Start', async () => {
    const app = fastify()
    const identityService = new IdentityService(app)
    await identityService.start()
    expect(await identityService.isAlive()).toBe(true)
  })
  it('Can Stop', async () => {
    const app = fastify()
    const identityService = new IdentityService(app)
    await identityService.start()
    await identityService.stop()
    expect(await identityService.isAlive()).toBe(false)
  })
  it('Serves Traffic', async () => {
    const app = fastify()
    const identityService = new IdentityService(app)
    const serveTraffic = identityService.servesTraffic()
    expect(serveTraffic).toBe(true)
  })
  it('Can Be Destroyed', async () => {
    const app = fastify()
    const identityService = new IdentityService(app)
    await identityService.start()
    await identityService.destroy()
    expect(await identityService.isAlive()).toBe(false)
  })
  it('Can Determine Its Alive', async () => {
    const app = fastify()
    const identityService = new IdentityService(app)
    await identityService.start()
    expect(identityService.isAlive()).resolves.toBe(true)
  })
})
