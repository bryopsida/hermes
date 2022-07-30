import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActorConfig } from '../../common/interfaces/actor'
import createLogger from '../../common/logger/factory'
import { IUnprocesseedJsonData, IProcessedJsonData } from '../../common/models/watchModels'
import { KafkaConsumer } from 'node-rdkafka'
import { Queue } from 'bull'
import { ClassifierClient } from '../../clients/classifiersClient'
import { IDataSource } from '../../services/dataSourceManager/dao/dataSource'
import { KafkaTransformerActor } from '../kafkaTransformerActor'

/**
 * Actor that enhances fetched data with metadata computed from classifications
 */
export class JsonProcessorActor extends KafkaTransformerActor<IUnprocesseedJsonData, IProcessedJsonData> {
  public readonly log = createLogger({
    serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  readonly config: IActorConfig
  readonly name: string
  readonly topic: string
  readonly normalizeQueue: Queue
  readonly classifierClient: ClassifierClient
  kafkaConsumer?: KafkaConsumer

  constructor (config : IActorConfig, normalizeQueue: Queue, classifierClient: ClassifierClient) {
    super()
    this.config = config
    this.name = 'jsonProcessorActor'
    this.topic = 'jsonData'
    this.normalizeQueue = normalizeQueue
    this.classifierClient = classifierClient
    this.log.info(`${this.name} actor created`)
  }

  getNextTopic (): Promise<string> {
    return Promise.resolve('processed.jsonData')
  }

  getKey (message: IUnprocesseedJsonData, _result: IProcessedJsonData): Promise<string> {
    // order delivery is determined by partition, partition is determined by key
    return Promise.resolve(message.dataSource?.uri || message.jobId)
  }

  // TODO: ensure upstream is including IDataSource of the triggerring source in the message
  async transform (message: IUnprocesseedJsonData): Promise<IProcessedJsonData> {
    this.log.debug('json processor actor acting on message')
    let fetchedAllDataSources = false
    let offset = 0
    const count = 100
    const normalizePromises: Promise<any>[] = []
    const processedJson : IProcessedJsonData = {
      ...message,
      ...{
        metadata: {}
      }
    }
    do {
      const pagedResult = await this.classifierClient.getClassifiers(offset, count, message.dataSource as IDataSource)
      pagedResult.items.forEach((classifier) => {
        normalizePromises.push(this.normalizeQueue.add({
          target: message,
          classifier
        }).then((jobResult) => {
          if (!processedJson.metadata[classifier.resultBucketName]) {
            processedJson.metadata[classifier.resultBucketName] = []
          }
          processedJson.metadata[classifier.resultBucketName].push(jobResult.data)
        }).catch((err) => {
          this.log.error(`Error processing job for classifier ${classifier.id}`, err)
        }))
      })

      fetchedAllDataSources = pagedResult.totalCount <= offset + count
      offset += count
    } while (!fetchedAllDataSources)
    await Promise.all(normalizePromises)
    return processedJson
  }
}
