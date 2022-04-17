import { FastifyInstance } from 'fastify'
import middie from 'middie'
import { Provider } from 'oidc-provider'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IService } from '../../common/interfaces/service'
import createLogger from '../../common/logger/factory'
import { IIdentityConfig, IdentifyConfigFactory } from '../../config/identityConfig'

export class IdentityService implements IService {
  public static readonly NAME = 'identity'
  private static readonly log = createLogger({
    serviceName: `identity-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  private readonly provider: Provider
  private readonly config: IIdentityConfig
  readonly ID: string
  private _isAlive = false;

  constructor (app: FastifyInstance) {
    IdentityService.log.debug('Initializing identity service')
    this.ID = IdentityService.NAME
    this.config = IdentifyConfigFactory.buildConfig(this.ID)
    this.provider = new Provider(this.config.issuer, this.config.providerConfig)
    app.register(middie).then(() => {
      try {
        app.use(this.config.mountPath, this.provider.callback)
      } catch (err) {
        IdentityService.log.error('Error registering identity service: %s', err)
      }
    })
  }

  async start (): Promise<void> {
    IdentityService.log.info('Starting identity service on: %s, with issuer: %s', this.config.mountPath, this.config.issuer)
    this._isAlive = true
  }

  stop (): Promise<void> {
    IdentityService.log.info('Stopping identity service')
    this._isAlive = false
    return Promise.resolve()
  }

  destroy (): Promise<void> {
    return this.stop()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(this._isAlive)
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.resolve(this._isAlive)
  }

  servesTraffic (): boolean {
    return true
  }
}
