import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActorConfig } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { IUnprocesseedJsonData, IProcessedJsonData } from '../../common/models/watchModels'
import { KafkaConsumer } from 'node-rdkafka'
import { KafkaConsumerActor } from '../kafkaConsumerActor'

/**
 * Actor that enhances fetched data with metadata computed from classifications
 */
export class JsonProcessorActor extends KafkaConsumerActor<IUnprocesseedJsonData, IProcessedJsonData> {
  public readonly log = createLogger({
    serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  readonly config: IActorConfig
  readonly name: string
  readonly topic: string
  kafkaConsumer?: KafkaConsumer

  constructor (config : IActorConfig) {
    super()
    this.config = config
    this.name = 'jsonProcessorActor'
    this.topic = 'jsonData'
    this.log.info(`${this.name} actor created`)
  }

  actOn (message: IUnprocesseedJsonData): Promise<IProcessedJsonData> {
    this.log.debug('json processor actor acting on message')
    return Promise.resolve({} as IProcessedJsonData)
  }
}
