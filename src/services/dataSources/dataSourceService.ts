import { IService } from '../../common/interfaces/service'
import { FastifyInstance } from 'fastify'
import registerDataSourceRoute from './routes/dataSource'
import mongoose from 'mongoose'

export class DataSourceService implements IService {
  constructor (private readonly fastify: FastifyInstance) {
    this.registerRoutes()
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
