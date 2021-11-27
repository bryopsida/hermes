import { Queue, Job, DoneCallback } from 'bull'
import createLogger from '../../common/logger/factory'
import { DeliveryReport, LibrdKafkaError, Producer } from 'node-rdkafka'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { ITask } from '../../common/interfaces/task'
export interface HeartbeatTaskParams {}

export class HeartbeatTask implements ITask {
    id = 'heartbeat';

    private readonly log = createLogger({
      serviceName: `heartbeat-task-${COMPUTED_CONSTANTS.id}`,
      level: 'debug'
    })

    private onDeliveryReport (err: LibrdKafkaError, report: DeliveryReport) {
      if (err) {
        this.log.error(`Kafka producer delivery report error: ${err}`)
      } else {
        this.log.debug(`Kafka producer delivery report: ${report}`)
      }
    }

    private onError (err: LibrdKafkaError) {
      this.log.error(`Kafka producer error: ${err}`)
    }

    private onReady () {
      this.log.debug('Kafka producer ready')
    }

    constructor (private queue: Queue, private kafkaProducer: Producer) {
      this.log.debug(`Heartbeat task initialized on queue ${queue.name}`)
      queue.process('heartbeat', this.processJob.bind(this))

      this.kafkaProducer.on('ready', this.onReady.bind(this))
      this.kafkaProducer.on('event.error', this.onError.bind(this))
      this.kafkaProducer.on('delivery-report', this.onDeliveryReport.bind(this))
      this.kafkaProducer.connect()
    }

    // TODO: pick a better key value or leave as null
    private processJob (job: Job<HeartbeatTaskParams>, done: DoneCallback) {
      this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`)
      this.kafkaProducer.produce('heartbeats', null, Buffer.from(JSON.stringify({
        jobId: job.id,
        sourceQueue: job.queue.name,
        timestamp: job.timestamp,
        data: job.data
      })), COMPUTED_CONSTANTS.id as string, new Date().getTime())
      done()
    }

    async stop () : Promise<void> {
      this.kafkaProducer.removeAllListeners()
      if (this.kafkaProducer.isConnected()) {
        this.kafkaProducer.disconnect()
      }
      await this.queue.close(true)
    }
}
