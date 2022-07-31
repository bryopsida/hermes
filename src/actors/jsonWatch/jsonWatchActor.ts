import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActorConfig } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { IJsonWatchResult, IProcessedJsonData } from '../../common/models/watchModels'
import { KafkaConsumer } from 'node-rdkafka'
import { KafkaConsumerActor } from '../kafkaConsumerActor'
import kafkaConfigFactory from '../../config/kafkaConfig'

export class JsonWatchActor extends KafkaConsumerActor<IProcessedJsonData, IJsonWatchResult> {
  public readonly log = createLogger({
    serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  private static readonly NAME = 'jsonWatchActor'

  readonly config: IActorConfig
  readonly name: string
  readonly topic: string
  kafkaConsumer?: KafkaConsumer

  constructor (config : IActorConfig) {
    super(kafkaConfigFactory.buildConfig(JsonWatchActor.NAME))
    this.config = config
    this.name = JsonWatchActor.NAME
    this.topic = 'processed.jsonData'
    this.log.info(`${this.name} actor created`)
  }

  actOn (message: IProcessedJsonData): Promise<IJsonWatchResult> {
    this.log.debug('json watch actor acting on message')
    return Promise.resolve({} as IJsonWatchResult)
  }
}
