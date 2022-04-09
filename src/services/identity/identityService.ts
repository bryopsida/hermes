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
  private readonly app: FastifyInstance
  private readonly config: IIdentityConfig
  readonly ID: string

  constructor (app: FastifyInstance) {
    IdentityService.log.debug('Initializing identity service')
    this.ID = IdentityService.NAME
    this.config = IdentifyConfigFactory.buildConfig(this.ID)
    this.provider = new Provider(this.config.issuer, this.config.providerConfig)
    this.app = app
  }

  async start (): Promise<void> {
    IdentityService.log.info('Starting identity service on: %s, with issuer: %s', this.config.mountPath, this.config.issuer)
    await this.app.register(middie)
    this.app.use(this.config.mountPath, this.provider.callback())
  }

  stop (): Promise<void> {
    IdentityService.log.info('Stopping identity service')
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
