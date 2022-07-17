import { FastifyInstance } from 'fastify'
import { IService } from '../../common/interfaces/service'
import classificationManagerRoutes from './routes/classificationRoutes'

export class ClassificationService implements IService {
  public static readonly NAME : string = 'classification_manager'
  private _isAlive: boolean = false
  private readonly _fastify: FastifyInstance

  constructor (fastify: FastifyInstance) {
    this.ID = ClassificationService.NAME
    this._fastify = fastify
    this.register()
  }

  private register (): void {
    this._fastify.register(classificationManagerRoutes, {
      prefix: '/api/classification_manager/v1'
    })
  }

  start (): Promise<void> {
    this._isAlive = true
    return Promise.resolve()
  }

  stop (): Promise<void> {
    this._isAlive = false
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await this.stop()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(this._isAlive)
  }

  canServeTraffic (): Promise<boolean> {
    return this.isAlive()
  }

  servesTraffic (): boolean {
    return true
  }

  ID: string = ClassificationService.NAME
  ORDER: number = 1
}
