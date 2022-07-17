import { IService } from '../../common/interfaces/service'
import { FastifyInstance } from 'fastify'
import dataSourceRoutes from './routes/dataSource'
import { Connection } from 'mongoose'
import { IDataEncryptor } from '../../common/interfaces/crypto/dataEncryption'

export class DataSourceService implements IService {
  public static readonly NAME = 'data_source_manager'
  public readonly ID = DataSourceService.NAME
  public readonly ORDER = 1

  constructor (private readonly fastify: FastifyInstance, private readonly mongoose: Connection, private readonly crypto: IDataEncryptor) {
    this.register()
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

  private register (): void {
    this.fastify.register(dataSourceRoutes, {
      mongoose: this.mongoose,
      prefix: '/api/data_source_manager/v1',
      crypto: this.crypto
    })
  }

  start (): Promise<void> {
    return Promise.resolve()
  }

  stop (): Promise<void> {
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await this.mongoose.close()
  }
}
