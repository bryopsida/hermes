import { Queue, Job } from 'bull'
import createLogger from '../../common/logger/factory'
import { Producer } from 'node-rdkafka'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { ProducerTask } from '../producerTask'
export interface HeartbeatTaskParams {}

/**
 * Periodically sends a message to the kafka topic, can be to confirm connectivity/comms
 */
export class HeartbeatTask extends ProducerTask {
  id = 'heartbeat'

  log = createLogger({
    serviceName: `heartbeat-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (queue: Queue, kafkaProducer: Producer) {
    super(queue, 'heartbeat', kafkaProducer)
    this.log.debug(`Heartbeat task initialized on queue ${queue.name}`)
  }

  protected publish (data: unknown, job: Job<unknown>): Promise<void> {
    this.kafkaProducer.produce('heartbeats', null, Buffer.from(JSON.stringify({
      jobId: job.id,
      sourceQueue: job.queue.name,
      timestamp: job.timestamp,
      data: job.data
    })), COMPUTED_CONSTANTS.id as string, new Date().getTime())
    return Promise.resolve()
  }

  // TODO: pick a better key value or leave as null
  public async processJob (job: Job<HeartbeatTaskParams>) : Promise<unknown> {
    this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`)
    await this.publish(job.data, job)
    return Promise.resolve(job.data)
  }
}
