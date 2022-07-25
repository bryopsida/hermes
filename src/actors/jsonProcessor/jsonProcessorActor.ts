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

  // TODO: pipe in bull client to create and get task results
  // TODO: pipe in classification api client to get classifications
  constructor (config : IActorConfig) {
    super()
    this.config = config
    this.name = 'jsonProcessorActor'
    this.topic = 'jsonData'
    this.log.info(`${this.name} actor created`)
  }

  // TODO: ensure upstream is including IDataSource of the triggerring source in the message
  actOn (message: IUnprocesseedJsonData): Promise<IProcessedJsonData> {
    this.log.debug('json processor actor acting on message')
    // TODO: add loop to fetch all classifications
    // TODO: for each classification if any, kick off task in bull to compute metadata
    // TODO: await each task to complete
    // TODO: merge all metadata into one object, use resultBucketName to store it
    // TODO: return result
    // TODO: ensure returned result goes to next topic for watch actor
    return Promise.resolve({} as IProcessedJsonData)
  }
}
