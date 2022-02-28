import { Provider } from 'oidc-provider'
import { IService } from '../../common/interfaces/service'

export class IdentityService implements IService {
  private provider: Provider
  readonly ID: string;

  constructor () {
    this.provider = new Provider('http://localhost:8080', {})
    this.ID = 'identity'
  }

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
}
