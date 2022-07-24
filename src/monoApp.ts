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
import { TartarusService } from './services/tartarus/tartarusServices'
import { ClassificationService } from './services/classificationManager/classificationService'
import { AuthenticationDecorator } from './decorators/fastify/authenticationDecorator'
import { ErrorHandlerDecorator } from './decorators/fastify/errorHandlerDecorator'
import { seedKeys } from './common/crypto/seedKeys'
import mongodbConfig from './config/mongodbConfig'
import { ConnectOptions, createConnection, Connection } from 'mongoose'
import { CryptoFactory } from './factories/cryptoFactory'

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

// if we are in development seed keys
function primary () {
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
}

async function worker () {
  const logger = createLogger({
    serviceName: `worker-${computedConstants.id}`,
    level: 'debug'
  })

  // create fastify instance
  // TODO: move out to factory
  const app :FastifyInstance = fastify({
    logger: createLogger({
      serviceName: `worker-${computedConstants.id}-fastify`,
      level: 'debug',
      redact: ['req.headers.authorization'],
      serializers: {
        req: (request) => {
          return {
            method: request.method,
            url: request.url,
            headers: request.headers,
            hostname: request.hostname,
            remoteAddress: request.ip,
            remotePort: request.socket.remotePort
          }
        }
      }
    })
  })
  app.register(fastifyHelmet)
  ErrorHandlerDecorator.decorate(app)
  AuthenticationDecorator.decorate(app)

  // get a mongoose connection for data sources
  // clean up
  const dataSourceMongooseConnConfig = mongodbConfig.buildConfig('data_source_manager')
  const classifcationMongooseConnConfig = mongodbConfig.buildConfig('classification_manager')
  const dataSourceConn : Connection = createConnection(dataSourceMongooseConnConfig.getServerUrl(), dataSourceMongooseConnConfig.getMongooseOptions() as ConnectOptions)
  const classificationConn : Connection = createConnection(classifcationMongooseConnConfig.getServerUrl(), classifcationMongooseConnConfig.getMongooseOptions() as ConnectOptions)

  const crypto = CryptoFactory.create({
    scope: 'defaultCrypto'
  })

  // TODO: fix as any cast
  // define services managed by this mono app entry point
  const services : Array<IService> = [
    isServiceEnabled(DataSourceService.NAME) ? new DataSourceService(app as any, dataSourceConn, crypto) : undefined,
    isServiceEnabled(TaskRunnerService.NAME) ? new TaskRunnerService(queueOptions, crypto) : undefined,
    isServiceEnabled(WatchManagementService.NAME) ? new WatchManagementService(app) : undefined,
    isServiceEnabled(TheatreService.NAME) ? new TheatreService() : undefined,
    isServiceEnabled(BullBoardService.NAME) ? new BullBoardService(app, queueOptions) : undefined,
    isServiceEnabled(TartarusService.NAME) ? new TartarusService() : undefined,
    isServiceEnabled(ClassificationService.NAME) ? new ClassificationService(app, classificationConn) : undefined
  ].filter(s => s != null).sort() as Array<IService>

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
    try {
      await crypto?.close()
    } catch (err) {
      logger.error(`Error while closing crypto: ${err}`)
    }
    try {
      await dataSourceConn.close()
      await classificationConn.close()
    } catch (err) {
      logger.error(`Error while closing mongoose: ${err}`)
    }
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

async function bootstrap () : Promise<void> {
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
    await seedKeys()
  }
  if (cluster.isPrimary && process.env.USE_CLUSTERING === 'true') {
    primary()
  } else {
    worker()
  }
}

bootstrap()
