import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActorConfig } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { IJsonWatchResult, IWatchedJsonData } from '../../common/models/watchModels'
import { KafkaConsumer } from 'node-rdkafka'
import { KafkaConsumerActor } from '../kafkaConsumerActor'

export class JsonWatchActor extends KafkaConsumerActor<IWatchedJsonData, IJsonWatchResult> {
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
    this.name = 'jsonWatchActor'
    this.topic = 'processed.jsonData'
    this.log.info(`${this.name} actor created`)
  }

  actOn (message: IWatchedJsonData): Promise<IJsonWatchResult> {
    this.log.debug('json watch actor acting on message')
    return Promise.resolve({} as IJsonWatchResult)
  }
}
