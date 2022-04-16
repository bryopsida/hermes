import { IService } from '../../common/interfaces/service'

// TODO
export class ClassificationService implements IService {
  public static readonly NAME : string = 'classification_manager'
  start (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  stop (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  destroy (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  isAlive (): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  canServeTraffic (): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  servesTraffic (): boolean {
    throw new Error('Method not implemented.')
  }

  ID: string;
}
