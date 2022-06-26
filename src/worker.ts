import cluster from 'cluster'
import { FastifyInstance } from 'fastify'
import computedConstants from './common/computedConstants'
import { IService } from './common/interfaces/service'
import createLogger from './common/logger/factory'
import config from 'config'

export class HermesWorker {
  readonly logger = createLogger({
    serviceName: `worker-${computedConstants.id}-runner`,
    level: 'debug'
  })

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
    this.logger.info('Finished starting sub services')
    const listenOpts = {
      port: config.get<number>('port'),
      host: '0.0.0.0'
    }
    this.logger.info(`Binding to ${listenOpts.host}:${listenOpts.port}`)
    await this.app.listen(listenOpts)
    this.logger.info(`Listening on ${listenOpts.host}:${listenOpts.port}`)
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
