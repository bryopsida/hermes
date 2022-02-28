import { IdentityService } from '../../../src/services/identity/identityService'
/* eslint-disable no-undef */
describe('Services.Identity', () => {
  it('Can Determine If It Can Serve Traffic', async () => {
    const identityService = new IdentityService()
    const canServe = await identityService.canServeTraffic()
    expect(canServe).toBe(true)
  })
  it('Can Start', async () => {
    const identityService = new IdentityService()
    await identityService.start()
    expect(await identityService.isAlive).toBe(true)
  })
  it('Can Stop', async () => {
    const identityService = new IdentityService()
    await identityService.start()
    await identityService.stop()
    expect(await identityService.isAlive).toBe(false)
  })
  it('Serves Traffic', async () => {
    const identityService = new IdentityService()
    const serveTraffic = identityService.servesTraffic()
    expect(serveTraffic).toBe(true)
  })
  it('Can Be Destroyed', async () => {
    const identityService = new IdentityService()
    await identityService.start()
    await identityService.destroy()
    expect(await identityService.isAlive).toBe(false)
  })
  it('Can Determine Its Alive', async () => {
    const identityService = new IdentityService()
    expect(identityService.isAlive()).resolves.toBe(true)
  })
})
