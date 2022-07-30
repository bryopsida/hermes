import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActorConfig } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { KafkaConsumer } from 'node-rdkafka'
import { IHeartbeat } from '../../common/interfaces/heartbeat'
import { KafkaConsumerActor } from '../kafkaConsumerActor'
import kafkaConfig from '../../config/kafkaConfig'

export class HeartbeatActor extends KafkaConsumerActor<IHeartbeat, boolean> {
  protected readonly log = createLogger({
    serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  private static readonly NAME = 'heartbeatActor'

  readonly name: string
  readonly topic: string
  readonly config: IActorConfig

  kafkaConsumer?: KafkaConsumer

  constructor (config: IActorConfig) {
    super(kafkaConfig.buildConfig(HeartbeatActor.NAME))
    this.config = config
    this.name = HeartbeatActor.NAME
    this.topic = 'heartbeats'
    this.log.info(`${this.name} actor created`)
  }

  actOn (message: IHeartbeat): Promise<boolean> {
    this.log.debug('heartbeat actor acting on message')
    return Promise.resolve(true)
  }
}
