import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActorConfig } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { KafkaConsumer } from 'node-rdkafka'
import { IHeartbeat } from '../../common/interfaces/heartbeat'
import { KafkaConsumerActor } from '../kafkaConsumerActor'

export class HeartbeatActor extends KafkaConsumerActor<IHeartbeat, boolean> {
    protected readonly log = createLogger({
      serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
      level: 'debug'
    })

    readonly name: string;
    readonly topic: string;
    readonly config: IActorConfig;

    kafkaConsumer?: KafkaConsumer;

    constructor (config: IActorConfig) {
      super()
      this.config = config
      this.name = 'heartbeatActor'
      this.topic = 'heartbeats'
      this.log.info(`${this.name} actor created`)
    }

    actOn (message: IHeartbeat): Promise<boolean> {
      this.log.debug('heartbeat actor acting on message')
      return Promise.resolve(true)
    }
}
