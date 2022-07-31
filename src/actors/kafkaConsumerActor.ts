import { Logger } from 'pino'
import { IActorConfig } from '../common/interfaces/actor'
import { KafkaActor } from './kafkaActor'

export abstract class KafkaConsumerActor<M, R> extends KafkaActor<M, R> {
  public abstract readonly name: string
  protected abstract readonly log: Logger
  public abstract readonly topic: string
  protected abstract readonly config: IActorConfig
  public abstract actOn (message: M): Promise<R>
}
