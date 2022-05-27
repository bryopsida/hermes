import { IService } from '../../common/interfaces/service'
import BullQueue, { Queue, QueueOptions } from 'bull'
import createLogger from '../../common/logger/factory'
import { FetchTask } from '../../tasks/fetch/fetchTask'
import { HeartbeatTask } from '../../tasks/heartbeat/heartbeatTask'
import { QueueNames } from '../../common/queues/queueNameConstants'
import kafkaTopicConfig from '../../common/topics/kafkaTopicConfig'
import { Producer, ProducerTopicConfig } from 'node-rdkafka'
import { ITask } from '../../common/interfaces/task'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { QueueFetchesTask } from '../../tasks/queueFetches/queueFetchesTask'
import taskConfigFactory, { IFetchTaskConfig } from '../../config/taskConfig'
import kafkaConfigFactory from '../../config/kafkaConfig'
import { SeedAdminUserTask } from '../../tasks/user/seedAdminAccount'

// TODO: refactor to be more IoC friendly
const fetchTaskConfig = taskConfigFactory<IFetchTaskConfig>('fetch')

/**
 * Houses the tasks executed by the task backend (Bull)
 */
export class TaskRunnerService implements IService {
    public static readonly NAME = 'task_runner'
    private readonly _queues: Map<QueueNames, Queue> = new Map();
    private readonly _tasks: Map<string, ITask> = new Map();
    private readonly _queueOptions: QueueOptions;
    public readonly ID = TaskRunnerService.NAME

    private readonly log = createLogger({
      serviceName: `task-runner-${COMPUTED_CONSTANTS.id}`,
      level: 'debug'
    })

    constructor (queueOptions: QueueOptions) {
      this._queueOptions = queueOptions
    }

    isAlive (): Promise<boolean> {
      return Promise.resolve(true)
    }

    canServeTraffic (): Promise<boolean> {
      return Promise.resolve(false)
    }

    servesTraffic (): boolean {
      return false
    }

    private async createFetchQueue () {
      const fetchQueueOptions = {
        ...this._queueOptions,
        ...{
          prefix: '{fetch}'
        }
      } as QueueOptions

      const FETCH_QUEUE = new BullQueue(QueueNames.FETCH_QUEUE, fetchQueueOptions).on('error', (err) => {
        this.log.error('Fetch queue error')
        this.log.error(err)
      })

      this.log.info(`Fetch queue ${FETCH_QUEUE.name} created, with prefix ${fetchQueueOptions.prefix}`)

      FETCH_QUEUE.on('error', (error) => {
        this.log.error('Error in fetch queue')
        this.log.error(error)
      })

      FETCH_QUEUE.add('queue_fetches', {
        baseUrl: fetchTaskConfig.sourceApiUrl,
        batchSize: fetchTaskConfig.batchSize
      }, { repeat: { cron: '*/5 * * * *' } })

      this._queues.set(QueueNames.FETCH_QUEUE, FETCH_QUEUE)
      const fetchTask: ITask = new FetchTask(this._queues.get(QueueNames.FETCH_QUEUE)as Queue, new Producer({
        'metadata.broker.list': kafkaConfigFactory.buildConfig(TaskRunnerService.NAME).brokers.join(',')
      }, kafkaTopicConfig.jsonData.producer as ProducerTopicConfig))

      const queueFetchTask: ITask = new QueueFetchesTask(this._queues.get(QueueNames.FETCH_QUEUE) as Queue)
      this._tasks.set(fetchTask.id, fetchTask)
      this._tasks.set(queueFetchTask.id, queueFetchTask)
    }

    private async createHeartbeatQueue (): Promise<void> {
      const heartbeatQueueOptions = {
        ...this._queueOptions,
        ...{
          prefix: '{heartbeat}'
        }
      } as QueueOptions

      const HEARTBEAT_QUEUE = new BullQueue(QueueNames.HEARTBEAT_QUEUE, heartbeatQueueOptions).on('error', (err) => {
        this.log.error('Heartbeat queue error')
        this.log.error(err)
      })

      this.log.info(`Heartbeat queue ${HEARTBEAT_QUEUE.name} created, with prefix ${heartbeatQueueOptions.prefix}`)

      HEARTBEAT_QUEUE.on('error', (error) => {
        this.log.error('Error in heartbeat queue')
        this.log.error(error)
      })
      HEARTBEAT_QUEUE.add('heartbeat', {}, { repeat: { cron: '*/1 * * * *' } })

      this._queues.set(QueueNames.HEARTBEAT_QUEUE, HEARTBEAT_QUEUE)
      const heartbeatTask: ITask = new HeartbeatTask(this._queues.get(QueueNames.HEARTBEAT_QUEUE) as Queue, new Producer({
        'metadata.broker.list': kafkaConfigFactory.buildConfig(TaskRunnerService.NAME).brokers.join(',')
      }, kafkaTopicConfig.heartbeats.producer as ProducerTopicConfig))
      this._tasks.set(heartbeatTask.id, heartbeatTask)
    }

    private async addSeedAdminUserJobIfEnabled () : Promise<void> {
      const executeSeed = process.env.SEED_ADMIN_ACCOUNT === 'true'
      // check if the job with that ID already exists and has completed
      // if not add it to the queue
      if (!executeSeed) {
        this.log.debug('Not creating the admin seed task')
        return Promise.resolve()
      } else {
        const seedTask: ITask = new SeedAdminUserTask(this._queues.get(QueueNames.USER_QUEUE) as Queue)
        this._tasks.set(seedTask.id, seedTask)
        this.log.info('Created admin seed task')
      }
    }

    private async createUserQueue () : Promise<void> {
      this.log.info('Creating user manamgent queue')
      const userQueueOptions = {
        ...this._queueOptions,
        ...{
          prefix: '{user}'
        }
      } as QueueOptions

      const USER_QUEUE = new BullQueue(QueueNames.USER_QUEUE, userQueueOptions).on('error', (err) => {
        this.log.error('User queue error')
        this.log.error(err)
      })

      this.log.info(`User queue ${USER_QUEUE.name} created, with prefix ${userQueueOptions.prefix}`)

      USER_QUEUE.on('error', (error) => {
        this.log.error('Error in user queue')
        this.log.error(error)
      })
      this._queues.set(QueueNames.USER_QUEUE, USER_QUEUE)
      await this.addSeedAdminUserJobIfEnabled()
    }

    public async start (): Promise<void> {
      this.log.info('Starting task runner service')
      await this.createFetchQueue()
      await this.createHeartbeatQueue()
      await this.createUserQueue()
      this.log.info('Task runner service started')
    }

    async stop (): Promise<void> {
      this.log.info('Stopping task runner service')
      await Promise.all(Array.from(this._queues.values()).map(queue => {
        queue.removeAllListeners()
        return queue.close(true)
      }).concat(Array.from(this._tasks.values()).map(task => task.stop())))
    }

    async destroy (): Promise<void> {
      await this.stop()
    }
}
