import { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'
import { IService } from '../../common/interfaces/service'
import registerWatchRoutes from './routes/watchRoutes'

export class WatchManagementService implements IService {
  public static readonly NAME = 'watch_management'
  public readonly ID = WatchManagementService.NAME
  constructor (private readonly fastify: FastifyInstance) {
    // register routes
    registerWatchRoutes(fastify)
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(true)
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.resolve(true)
  }

  servesTraffic (): boolean {
    return true
  }

  start (): Promise<void> {
    // on startup restore scheduled tasks
    return Promise.resolve()
  }

  stop (): Promise<void> {
    // cannot remove routes from fastify as of yet, also wouldn't be appropriate to stop the server instance.
    // could set a flag to 404 on all routes and remove it if started again.
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await mongoose.disconnect()
  }
}
