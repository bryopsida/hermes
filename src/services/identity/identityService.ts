import { Server } from 'http'
import { Provider } from 'oidc-provider'
import { IService } from '../../common/interfaces/service'
import { IIdentityConfig, IdentifyConfigFactory } from '../../config/identityConfig'

export class IdentityService implements IService {
  private readonly provider: Provider
  private readonly config: IIdentityConfig
  private server: Server
  readonly ID: string

  constructor () {
    this.ID = 'identity'
    this.config = IdentifyConfigFactory.buildConfig(this.ID)
    this.provider = new Provider(this.config.baseUrl, {})
  }

  start (): Promise<void> {
    return new Promise((resolve, reject) => {
      this.provider.listen(this.config.baseUrl, (err) => {

      })
    });
    this.server = await this.provider.listen(this.config.baseUrl)
  }

  stop (): Promise<void> {
    this.server.close()
    return Promise.resolve();
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
