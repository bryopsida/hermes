import { Job, Queue } from 'bull'
import { DeliveryReport, LibrdKafkaError, Producer } from 'node-rdkafka'
import { BaseTask } from './baseTask'

export abstract class ProducerTask extends BaseTask {
  protected readonly kafkaProducer: Producer

  protected constructor (queue: Queue, id: string, kafkaProducer: Producer) {
    super(queue, id)
    this.kafkaProducer = kafkaProducer
    this.kafkaProducer.on('ready', this.onReady.bind(this))
    this.kafkaProducer.on('event.error', this.onError.bind(this))
    this.kafkaProducer.on('delivery-report', this.onDeliveryReport.bind(this))
    this.kafkaProducer.connect()
  }

  protected onDeliveryReport (err: LibrdKafkaError, report: DeliveryReport) {
    if (err) {
      this.log.error(`Kafka producer delivery report error: ${err}`)
    } else {
      this.log.debug(`Kafka producer delivery report: ${report}`)
    }
  }

  protected onError (err: LibrdKafkaError) {
    this.log.error(`Kafka producer error: ${err}`)
  }

  protected onReady () {
    this.log.debug('Kafka producer ready')
  }

  override async stop (): Promise<void> {
    await super.stop()
    this.kafkaProducer.removeAllListeners()
    if (this.kafkaProducer.isConnected()) {
      this.kafkaProducer.disconnect()
    }
    await this.queue.close(true)
  }

  protected abstract publish(data: unknown, job: Job<unknown>) : Promise<void>;
}
