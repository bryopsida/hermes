import { IService } from '../../common/interfaces/service'

export abstract class BaseService implements IService {
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

  abstract ID: string;
  abstract ORDER: number;
}
