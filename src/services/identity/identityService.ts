import { Provider } from 'oidc-provider'
import { IService } from '../../common/interfaces/service'
import { IIdentityConfig, IdentifyConfigFactory } from '../../config/identityConfig'

export class IdentityService implements IService {
  public static readonly NAME = 'theatre'
  private readonly provider: Provider
  private readonly config: IIdentityConfig
  readonly ID: string

  constructor () {
    this.ID = 'identity'
    this.config = IdentifyConfigFactory.buildConfig(this.ID)
    this.provider = new Provider(this.config.baseUrl, {})
  }

  start (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.provider.listen(this.config.baseUrl, () => {
        return resolve()
      })
    })
  }

  stop (): Promise<void> {
    this.provider.close()
    return Promise.resolve()
  }

  destroy (): Promise<void> {
    return this.stop()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(true)
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.resolve(true)
  }

  servesTraffic (): boolean {
    return true
  }
}
