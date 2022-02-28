import { UserService } from '../../../src/services/user/userService'

/* eslint-disable no-undef */
describe('Services.User', () => {
  it('Can Determine If It Can Serve Traffic', async () => {
    const userService = new UserService()
    const canServe = await userService.canServeTraffic()
    expect(canServe).toBe(true)
  })
  it('Can Start', async () => {
    const userService = new UserService()
    await userService.start()
    expect(userService.isAlive()).resolves.toBe(true)
  })
  it('Can Stop', async () => {
    const userService = new UserService()
    await userService.start()
    await userService.stop()
    expect(userService.isAlive()).resolves.toBe(false)
  })
  it('Serves Traffic', async () => {
    const userService = new UserService()
    expect(userService.servesTraffic()).toBe(true)
  })
  it('Can Be Destroyed', async () => {
    const userService = new UserService()
    await userService.start()
    await userService.destroy()
    expect(userService.isAlive()).resolves.toBe(false)
  })
  it('Can Determine Its Alive', async () => {
    const userService = new UserService()
    expect(userService.isAlive()).resolves.toBe(true)
  })
})
