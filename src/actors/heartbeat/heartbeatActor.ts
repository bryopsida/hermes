import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActor } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { ConsumerTopicConfig, KafkaConsumer, LibrdKafkaError, Message } from 'node-rdkafka'
import kafkaTopicConfig from '../../common/ topics/kafkaTopicConfig'
import { IHeartbeat } from '../../common/interfaces/heartbeat'

export class HeartbeatActor implements IActor<IHeartbeat, boolean> {
    private readonly log = createLogger({
      serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
      level: 'debug'
    })

    readonly name: string;
    readonly topic: string;
    kafkaConsumer?: KafkaConsumer;

    constructor () {
      this.name = 'heartbeatActor'
      this.topic = 'heartbeats'
      this.log.info(`${this.name} actor created`)
    }

    actOn (message: IHeartbeat): Promise<boolean> {
      this.log.debug('heartbeat actor acting on message')
      return Promise.resolve(true)
    }

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
      const message: IHeartbeat = JSON.parse(data.value.toString())
      this.log.debug(`${this.name} actor received message, key: ${data.key}, value: ${data.value}, timestamp: ${message.timestamp}, topic: ${data.topic}`)
      await this.actOn(message)
    }

    startProcessing (): Promise<void> {
      this.kafkaConsumer = new KafkaConsumer({
        'group.id': this.name,
        'enable.auto.commit': true,
        'metadata.broker.list': process.env.KAFKA_BROKER_LIST || 'localhost:29092'
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

    stopProcessing (): Promise<void> {
      this.log.debug(`${this.name} actor stopped`)
      this.kafkaConsumer?.unsubscribe()
      this.kafkaConsumer?.removeAllListeners()
      this.kafkaConsumer?.disconnect()
      // clean up kafka consumer
      return Promise.resolve()
    }
}
