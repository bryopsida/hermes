/**
 * This service is responsible for managing user accounts.
 */
import mongoose from 'mongoose'
import { FastifyInstance } from 'fastify'
import { IService } from '../../common/interfaces/service'
import registerUserRoutes from './routes/userRoutes'
import createLogger from '../../common/logger/factory'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IUser } from './dao/user'

export class UserService implements IService {
  readonly ID = UserService.NAME
  public static readonly NAME: string = 'user_manager'
  private _isAlive = false

  private static readonly log = createLogger({
    serviceName: `user-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (app: FastifyInstance) {
    UserService.log.debug('Initializing user service')
    this.registerRoutes(app)
  }

  private registerRoutes (app: FastifyInstance): void {
    registerUserRoutes(app)
  }

  private async hasSeedAlreadyOccurred (): Promise<boolean> {
    return Promise.resolve(true)
  }

  private async seedAdminAccount (): Promise<void> {
    const executeSeed = process.env.SEED_ADMIN_ACCOUNT === 'true'
    if (!executeSeed) return Promise.resolve()
    // check if seed marker already exists
    if (await this.hasSeedAlreadyOccurred()) {
      UserService.log.warn('Account has already been seeded!')
      return Promise.resolve()
    }
    const adminUserAccount = process.env.INITIAL_ADMIN_USER_ACCOUNT
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD
    if (!adminUserAccount || !adminPassword) {
      UserService.log.error('Admin account information not found! Cannot seed account!')
      return Promise.resolve()
    }
  }

  async start (): Promise<void> {
    await this.seedAdminAccount()
    this._isAlive = true
    return Promise.resolve()
  }

  stop (): Promise<void> {
    this._isAlive = false
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await this.stop()
    await mongoose.disconnect()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(this._isAlive)
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.resolve(true)
  }

  servesTraffic (): boolean {
    return true
  }
}
