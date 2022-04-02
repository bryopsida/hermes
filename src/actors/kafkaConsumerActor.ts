import { LibrdKafkaError, Message, KafkaConsumer, ConsumerTopicConfig } from 'node-rdkafka'
import { Logger } from 'pino'
import kafkaTopicConfig from '../common/topics/kafkaTopicConfig'
import { IActor, IActorConfig } from '../common/interfaces/actor'

export abstract class KafkaConsumerActor<M, R> implements IActor<M, R> {
  public abstract readonly name: string
  protected abstract readonly log: Logger
  public abstract readonly topic: string
  protected abstract readonly config: IActorConfig
  protected abstract kafkaConsumer?: KafkaConsumer

  private onError (error: LibrdKafkaError) {
    this.log.error(`${this.name} actor error: ${JSON.stringify(error)}`)
  }

  private onReady () : void {
    this.log.info(`${this.name} actor ready`)
    this.kafkaConsumer?.subscribe([this.topic])
    this.kafkaConsumer?.consume()
  }

  private async onData (data: Message) : Promise<void> {
    if (!data.value) {
      this.log.warn(`${this.name} actor received empty message`)
      return Promise.resolve()
    }
    const message: M = JSON.parse(data.value.toString())
    this.log.debug(`${this.name} actor received message, key: ${data.key}, value: ${data.value}, timestamp: ${data.timestamp}, topic: ${data.topic}`)
    await this.actOn(message)
  }

  public startProcessing (): Promise<void> {
    this.kafkaConsumer = new KafkaConsumer({
      'group.id': this.name,
      'enable.auto.commit': true,
      'metadata.broker.list': this.config.brokers.join(',')
    }, kafkaTopicConfig.heartbeats.consumer as ConsumerTopicConfig)

    this.kafkaConsumer.on('ready', this.onReady.bind(this))
    this.kafkaConsumer.on('data', this.onData.bind(this))
    this.kafkaConsumer.on('event.error', this.onError.bind(this))
    this.kafkaConsumer.on('event.log', (log) => {
      this.log.debug(`${this.name} actor event: ${JSON.stringify(log)}`)
    })
    this.kafkaConsumer.on('event.stats', (stats) => { // stats is an object with the following keys:
      this.log.debug(`${this.name} actor event: ${JSON.stringify(stats)}`)
    })
    this.kafkaConsumer.on('event.throttle', (throttle) => { // throttle is an object with the following keys:  throttle.time_ms, throttle.rate_limit, throttle.previous_time_ms, throttle.previous_rate_limit, throttle.timeout
      this.log.debug(`${this.name} actor event: ${JSON.stringify(throttle)}`)
    })
    this.kafkaConsumer.on('disconnected', () => { // disconnected is an object with the following keys:  disconnected.code, disconnected.message, disconnected.reason
      this.log.debug(`${this.name} actor event: disconnected`)
    })
    this.kafkaConsumer.connect()

    this.log.debug(`${this.name} actor started`)
    // create kafka consumer and point to acton
    return Promise.resolve()
  }

  public stopProcessing (): Promise<void> {
    this.log.debug(`${this.name} actor stopped`)
    this.kafkaConsumer?.unsubscribe()
    this.kafkaConsumer?.removeAllListeners()
    this.kafkaConsumer?.disconnect()
    // clean up kafka consumer
    return Promise.resolve()
  }

  public abstract actOn (message: M): Promise<R>
}
