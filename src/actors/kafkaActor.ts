import { ConsumerTopicConfig, KafkaConsumer, LibrdKafkaError, Message, Producer } from 'node-rdkafka'
import { Logger } from 'pino'
import { IActor, IActorConfig } from '../common/interfaces/actor'
import { IKafkaConfig } from '../config/kafkaConfig'
import kafkaTopicConfig from '../common/topics/kafkaTopicConfig'

export abstract class KafkaActor<M, R> implements IActor<M, R> {
  public abstract readonly name: string
  protected abstract readonly log: Logger
  public abstract readonly topic: string
  protected abstract readonly config: IActorConfig
  private readonly kafkaConfig: IKafkaConfig
  protected kafkaConsumer?: KafkaConsumer
  protected kafkaProducer?: Producer

  constructor (kafkaConfig: IKafkaConfig) {
    this.kafkaConfig = kafkaConfig
  }

  /**
   * Act on a incoming message.
   * @param message incoming message, this should be transformed to {R}
   */
  abstract actOn(message: M): Promise<R>

  protected onError (error: LibrdKafkaError) {
    this.log.error(`${this.name} actor error: ${JSON.stringify(error)}`)
  }

  protected onReady () : void {
    this.log.info(`${this.name} actor ready`)
    this.kafkaConsumer?.subscribe([this.topic])
    this.kafkaConsumer?.consume()
  }

  protected async onData (data: Message) : Promise<void> {
    if (!data.value) {
      this.log.warn(`${this.name} actor received empty message`)
      return Promise.resolve()
    }
    const message: M = JSON.parse(data.value.toString())
    this.log.debug(`${this.name} actor received message, key: ${data.key}, value: ${data.value}, timestamp: ${data.timestamp}, topic: ${data.topic}`)
    await this.actOn(message)
  }

  protected async onEventLog (log: any) {
    this.log.debug(`${this.name} actor event: ${JSON.stringify(log)}`)
  }

  protected async onEventStats (stats: any) {
    this.log.debug(`${this.name} actor event: ${JSON.stringify(stats)}`)
  }

  protected async onEventThrottle (throttleEvent: any) {
    this.log.debug(`${this.name} actor event: ${JSON.stringify(throttleEvent)}`)
  }

  protected async onDisconnected () {
    this.log.debug(`${this.name} actor event: disconnected`)
  }

  /**
   * Setup the kafka consumer object
   */
  protected async setupConsumer (): Promise<void> {
    this.kafkaConsumer = new KafkaConsumer({
      'group.id': this.name,
      'enable.auto.commit': true,
      'metadata.broker.list': this.config.brokers.join(',')
    }, kafkaTopicConfig.heartbeats.consumer as ConsumerTopicConfig)

    this.kafkaConsumer.on('ready', this.onReady.bind(this))
    this.kafkaConsumer.on('data', this.onData.bind(this))
    this.kafkaConsumer.on('event.error', this.onError.bind(this))
    this.kafkaConsumer.on('event.log', this.onEventLog.bind(this))
    this.kafkaConsumer.on('event.stats', this.onEventStats.bind(this))
    this.kafkaConsumer.on('event.throttle', this.onEventThrottle.bind(this))
    this.kafkaConsumer.on('disconnected', this.onDisconnected.bind(this))
    this.kafkaConsumer.connect()

    this.log.debug(`${this.name} actor consumer started`)
    // create kafka consumer and point to acton
    return Promise.resolve()
  }

  /**
   * Teardown the kafka consumer object
   */
  protected teardownConsumer (): Promise<void> {
    this.log.debug(`${this.name} actor consumer stopped`)
    this.kafkaConsumer?.unsubscribe()
    this.kafkaConsumer?.removeAllListeners()
    this.kafkaConsumer?.disconnect()
    // clean up kafka consumer
    return Promise.resolve()
  }

  /**
   * Setup the kafka producer object
   */
  protected setupProducer (): Promise<void> {
    return Promise.resolve()
  }

  /**
   * Tear down the kafka producer object
   */
  protected teardownProducer (): Promise<void> {
    return Promise.resolve()
  }

  /**
   * Start processing messages
   */
  async startProcessing (): Promise<void> {
    await this.setupProducer()
    await this.setupConsumer()
  }

  /**
   * Stop processing messages
   */
  async stopProcessing (): Promise<void> {
    await this.teardownConsumer()
    await this.teardownProducer()
  }
}
