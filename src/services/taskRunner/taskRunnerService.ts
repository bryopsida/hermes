import { IService } from '../../common/interfaces/service'
import BullQueue, { Queue, QueueOptions } from 'bull'
import createLogger from '../../common/logger/factory'
import { FetchTask } from '../../tasks/fetch/fetchTask'
import { HeartbeatTask } from '../../tasks/heartbeat/heartbeatTask'
import { QueueNames } from '../../common/queues/queueNameConstants'
import kafkaTopicConfig from '../../common/ topics/kafkaTopicConfig'
import { Producer, ProducerTopicConfig } from 'node-rdkafka'
import { ITask } from '../../common/interfaces/task'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { QueueFetchesTask } from '../../tasks/queueFetches/queueFetchesTask'

export class TaskRunnerService implements IService {
    private readonly _queues: Map<QueueNames, Queue> = new Map();
    private readonly _tasks: Map<string, ITask> = new Map();
    private readonly _queueOptions: QueueOptions;
    public readonly ID = 'taskRunnerService'

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

    public async start (): Promise<void> {
      this.log.info('Starting task runner service')

      // TODO: refactor be clean, generic
      const FETCH_QUEUE = new BullQueue(QueueNames.FETCH_QUEUE, this._queueOptions)
      FETCH_QUEUE.on('error', (error) => {
        this.log.error('Error in fetch queue', error)
      })

      const HEARTBEAT_QUEUE = new BullQueue(QueueNames.HEARTBEAT_QUEUE, this._queueOptions)
      HEARTBEAT_QUEUE.on('Error in heartbeat queue', (error) => {
        this.log.error(error)
      })
      HEARTBEAT_QUEUE.add('heartbeat', {}, { repeat: { cron: '*/1 * * * *' } })
      FETCH_QUEUE.add('queue_fetches', {
        baseUrl: 'http://localhost:3000/api/data_sources/v1',
        batchSize: 1000
      }, { repeat: { cron: '*/5 * * * *' } })

      this._queues.set(QueueNames.FETCH_QUEUE, FETCH_QUEUE)
      this._queues.set(QueueNames.HEARTBEAT_QUEUE, HEARTBEAT_QUEUE)

      // load seed tasks from json file

      // TODO: this smells, evaluate and refactor
      const fetchTask: ITask = new FetchTask(this._queues.get(QueueNames.FETCH_QUEUE) as Queue)
      const heartbeatTask: ITask = new HeartbeatTask(this._queues.get(QueueNames.HEARTBEAT_QUEUE) as Queue, new Producer({
        'metadata.broker.list': 'localhost:29092'
      }, kafkaTopicConfig.heartbeats.producer as ProducerTopicConfig))
      const queueFetchTask: ITask = new QueueFetchesTask(this._queues.get(QueueNames.FETCH_QUEUE) as Queue)
      this._tasks.set(fetchTask.id, fetchTask)
      this._tasks.set(heartbeatTask.id, heartbeatTask)
      this._tasks.set(queueFetchTask.id, queueFetchTask)

      return Promise.resolve()
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
