// runs all of the components in one node process with clustering to spread across cores, not ideal but decent for testing
// for production use components will be deployed in k8s via helm chart as individuall containers
import { fastify, FastifyInstance } from 'fastify'
import cluster from 'cluster'
import { cpus } from 'os'
import { DataSourceService } from './services/dataSources/dataSourceService'
import createLogger from './common/logger/factory'
import computedConstants from './common/computedConstants'
import { WatchManagementService } from './services/watchManagement/watchManagementService'
import { TheatreService } from './services/theatre/theatreService'
import { IService } from './common/interfaces/service'
import { Primary } from './primary'
import { HermesWorker } from './worker'
import fastifyHelmet from 'fastify-helmet'
import { HealthSideKick } from './services/sidekicks/healthSidekick'

const cpuCount = cpus().length
const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || ''
  },
  prefix: '{bullQueue}'
}

if (cluster.isPrimary && process.env.USE_CLUSTERING === 'true') {
  const primary = new Primary(process.env.WORKER_COUNT ? parseInt(process.env.WORKER_COUNT) : cpuCount)
  primary.start()

  process.on('SIGINT', async () => {
    await primary.stop()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await primary.stop()
    process.exit(0)
  })
} else {
  const logger = createLogger({
    serviceName: `worker-${computedConstants.id}`,
    level: 'debug'
  })

  // create fastify instance
  const app :FastifyInstance = fastify({
    logger: createLogger({
      serviceName: `worker-${computedConstants.id}-fastify`,
      level: 'debug'
    })
  })

  app.register(fastifyHelmet)

  // TODO: fix as any cast
  // define services managed by this mono app entry point
  const services : Array<IService> = [
    new DataSourceService(app as any),
    // new TaskRunnerService(queueOptions),
    new WatchManagementService(app),
    new TheatreService()
    // new BullBoardService(app)
  ]

  const worker = new HermesWorker(services, app)
  const healthSideKick = new HealthSideKick(app, '/api/health/v1')
  services.forEach(service => healthSideKick.registerService(service))

  const stop = async () => {
    logger.info('Stopping services')
    await Promise.all([
      worker.stop(),
      worker.destroy()
    ]).catch(err => {
      logger.error(`Error while shutting down: ${err}})`)
    })
  }

  process.on('SIGINT', async () => {
    await stop()
    process.exit(0)
  })

  process.on('uncaughtException', async (err) => {
    logger.error(`Uncaught exception: ${JSON.stringify(err, null, 2)}`)
    await stop()
    process.exit(1)
  })

  process.on('unhandledRejection', async (reason, p) => {
    logger.error(`Unhandled rejection at: reason: ${reason}`)
    logger.error(reason)
    logger.error(p)
    await stop()
    process.exit(1)
  })

  worker.start().catch(async (err) => {
    logger.error('Failed to start worker: ', err)
    await stop()
    process.exit(1)
  })
}
