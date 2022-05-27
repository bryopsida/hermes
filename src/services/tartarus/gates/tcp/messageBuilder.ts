import { IMessage } from './message'

export interface IMessageBuilder {
  buildEndMessage(): IMessage;
}
