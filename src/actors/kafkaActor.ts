import { KafkaConsumer, Producer } from 'node-rdkafka'
import { Logger } from 'pino'
import { IActor, IActorConfig } from '../common/interfaces/actor'

export abstract class KafkaActor<M, R> implements IActor<M, R> {
  public abstract readonly name: string
  protected abstract readonly log: Logger
  public abstract readonly topic: string
  protected abstract readonly config: IActorConfig
  protected kafkaConsumer?: KafkaConsumer
  protected kafkaProducer?: Producer

  /**
   * Act on a incoming message.
   * @param message incoming message, this should be transformed to {R}
   */
  abstract actOn(message: M): Promise<R>;

  /**
   * Setup the kafka consumer object
   */
  protected setupConsumer (): void {

  }

  /**
   * Teardown the kafka consumer object
   */
  protected teardownConsumer (): void {

  }

  /**
   * Setup the kafka producer object
   */
  protected setupProducer (): void {

  }

  /**
   * Tear down the kafka producer object
   */
  protected teardownProducer (): void {

  }

  /**
   * Start processing messages
   */
  startProcessing (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  /**
   * Stop processing messages
   */
  stopProcessing (): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
