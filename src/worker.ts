import cluster from 'cluster'
import { FastifyInstance } from 'fastify'
import computedConstants from './common/computedConstants'
import { IService } from './common/interfaces/service'
import createLogger from './common/logger/factory'

export class HermesWorker {
  readonly logger = createLogger({
    serviceName: `worker-${computedConstants.id}-runner`,
    level: 'debug'
  });

  constructor (private readonly services: Array<IService>, private readonly app: FastifyInstance) {
    this.logger.info('Creating worker')
    process.on('message', this.onMessage.bind(this))
  }

  private onMessage (message: any) {
    this.logger.trace(`Received message: ${message}`)
    if (message === 'shutdown') {
      this.logger.warn('Received shutdown message')
      this.stop().then(() => {
        return this.destroy().then(() => {
          this.logger.info('Shutdown complete')
          cluster.worker?.disconnect()
        })
      })
    }
  }

  public async start () : Promise<void> {
    this.logger.info('Starting sub services')
    await Promise.all(this.services.map(service => service.start()))
    await this.app.listen(process.env.HERMES_SERVER_LISTEN_PORT || 3000, process.env.HERMES_SERVER_LISTEN_ADDRESS || '127.0.0.1')
  }

  public async stop () : Promise<void> {
    this.logger.info('Stopping sub services')
    await Promise.all(this.services.map(service => service.stop()))
    await this.app.close()
  }

  public async destroy () : Promise<void> {
    this.logger.info('Destroying sub services')
    await Promise.all(this.services.map(service => service.destroy()))
  }
}
