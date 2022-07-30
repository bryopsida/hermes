import { KafkaConsumerActor } from './kafkaConsumerActor'
import { Producer } from 'node-rdkafka'

/**
 * Actor that extends a consumer actor with intent to transform the acted on message
 * and publish into a different topic.
 */
export abstract class KafkaTransformerActor<M, R> extends KafkaConsumerActor<M, R> {
  abstract transform (message: M): Promise<R>
  abstract getNextTopic(): Promise<string>
  abstract getKey(message: M, result: R): Promise<string>
  protected abstract kafkaProducer: Producer

  public async actOn (message: M): Promise<R> {
    const transformedResult = await this.transform(message)
    // publish transformed result to next topic
    const nextTopic = await this.getNextTopic()
    const key = await this.getKey(message, transformedResult)
    await this.kafkaProducer?.produce(nextTopic, null, Buffer.from(JSON.stringify(transformedResult)), key)
    return transformedResult
  }
}
