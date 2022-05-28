import { IService } from '../../common/interfaces/service'
import { FastifyInstance } from 'fastify'
import registerDataSourceRoute from './routes/dataSource'
import mongoose from 'mongoose'

export class DataSourceService implements IService {
  public static readonly NAME = 'data_source_manager'
  public readonly ID = DataSourceService.NAME
  public readonly ORDER = 1
  constructor (private readonly fastify: FastifyInstance) {
    this.registerRoutes()
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

  private registerRoutes (): void {
    registerDataSourceRoute(this.fastify)
  }

  start (): Promise<void> {
    return Promise.resolve()
  }

  stop (): Promise<void> {
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await mongoose.disconnect()
  }
}
