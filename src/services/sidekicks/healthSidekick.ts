import { FastifyInstance } from 'fastify'
import { IService } from '../../common/interfaces/service'
import { IHealthSidekick } from '../../common/interfaces/sidekicks/health'
import createLogger from '../../common/logger/factory'
import { registerHealthRoutes } from './health/routes/healthController'

export class HealthSideKick implements IHealthSidekick {
  private readonly logger = createLogger({
    serviceName: 'health-sidekick',
    level: 'debug'
  });

  private readonly _services: Map<string, IService> = new Map()
  private readonly _basePath: string;

  constructor (fastify: FastifyInstance, basePath: string) {
    this.registerRoutes(fastify)
    this._basePath = basePath
    this.logger.info('Created health sidekick')
  }

  registerRoutes (fastify: FastifyInstance<import('http').Server, import('http').IncomingMessage, import('http').ServerResponse, import('fastify').FastifyLoggerInstance>) {
    registerHealthRoutes(fastify, this._basePath, this)
  }

  registerService (service: IService): void {
    this.logger.debug(`Registering service ${service.ID}`)
    this._services.set(service.ID, service)
  }

  unregisterService (service: IService): void {
    this.logger.debug(`Unregistering service ${service.ID}`)
    this._services.delete(service.ID)
  }

  isAlive (): Promise<boolean> {
    return Promise.all(Array.from(this._services.values()).map(service => service.isAlive()))
      .then(results => results.every(result => result))
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.all(Array.from(this._services.values()).filter(s => s.servesTraffic).map(service => service.canServeTraffic()))
      .then(results => results.every(result => result))
  }
}
