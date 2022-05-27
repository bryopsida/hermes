// runs all of the components in one node process with clustering to spread across cores, not ideal but decent for testing
// for production use components will be deployed in k8s via helm chart as individuall containers
// TODO: refactor to testable components
import { fastify, FastifyInstance } from 'fastify'
import cluster from 'cluster'
import { cpus } from 'os'
import { DataSourceService } from './services/dataSourceManager/dataSourceService'
import createLogger from './common/logger/factory'
import computedConstants from './common/computedConstants'
import { WatchManagementService } from './services/watchManager/watchManagementService'
import { TheatreService } from './services/theatre/theatreService'
import { IService } from './common/interfaces/service'
import { Primary } from './primary'
import { HermesWorker } from './worker'
import fastifyHelmet from '@fastify/helmet'
import { HealthSideKick } from './services/sidekicks/health/healthSidekick'
import { isServiceEnabled, isSideKickEnabled } from './config/isServiceEnabled'
import { TaskRunnerService } from './services/taskRunner/taskRunnerService'
import { BullBoardService } from './services/bullBoard/bullboardServices'
import redisConfigFactory from './config/redisConfig'
import { QueueOptions } from 'bull'
import { Cluster, NodeConfiguration, ClusterOptions } from 'ioredis'
import { IdentityService } from './services/identity/identityService'
import { UserService } from './services/user/userService'

const cpuCount = cpus().length

// TODO: (smell) move out to a config library/factory
const redisConfig = redisConfigFactory.buildConfig('task_runner')
const queueOptions = {
  redis: {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password
  },
  createClient: redisConfig.cluster
    ? () => new Cluster([{
      host: redisConfig.host,
      port: redisConfig.port
    } as NodeConfiguration], {
      enableReadyCheck: false,
      redisOptions: {
        password: redisConfig.password
      }
    } as ClusterOptions)
    : undefined
} as QueueOptions

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
  // TODO: move out to factory
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
    isServiceEnabled(DataSourceService.NAME) ? new DataSourceService(app as any) : undefined,
    isServiceEnabled(TaskRunnerService.NAME) ? new TaskRunnerService(queueOptions) : undefined,
    isServiceEnabled(WatchManagementService.NAME) ? new WatchManagementService(app) : undefined,
    isServiceEnabled(TheatreService.NAME) ? new TheatreService() : undefined,
    isServiceEnabled(BullBoardService.NAME) ? new BullBoardService(app, queueOptions) : undefined,
    isServiceEnabled(IdentityService.NAME) ? new IdentityService(app) : undefined,
    isServiceEnabled(UserService.NAME) ? new UserService(app) : undefined
  ].filter(s => s != null) as Array<IService>

  if (isSideKickEnabled(HealthSideKick.NAME)) {
    const healthSideKick = new HealthSideKick(app, '/api/health/v1')
    services.forEach(service => healthSideKick.registerService(service))
  }

  const worker = new HermesWorker(services, app)
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
    logger.error('Failed to start worker')
    logger.error(err)
    await stop()
    process.exit(1)
  })
}
