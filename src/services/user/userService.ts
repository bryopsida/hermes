/**
 * This service is responsible for managing user accounts.
 */
import mongoose from 'mongoose'
import { FastifyInstance } from 'fastify'
import { IService } from '../../common/interfaces/service'
import registerUserRoutes from './routes/userRoutes'
import createLogger from '../../common/logger/factory'
import COMPUTED_CONSTANTS from '../../common/computedConstants'

export class UserService implements IService {
  readonly ID = UserService.NAME
  readonly ORDER = 1
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

  async start (): Promise<void> {
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
