/**
 * This service is responsible for managing user accounts.
 */
import mongoose from 'mongoose'
import { FastifyInstance } from 'fastify'
import registerUserRoutes from './routes/userRoutes'
import createLogger from '../../common/logger/factory'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import oauthPlugin, { FastifyOAuth2Options } from '@fastify/oauth2'
import { BaseRestService } from '../common/BaseRestServices'

export class UserService extends BaseRestService {
  readonly ID = UserService.NAME
  readonly ORDER = 1
  public static readonly NAME: string = 'user_manager'
  private _isAlive = false

  private static readonly log = createLogger({
    serviceName: `user-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (app: FastifyInstance) {
    super()
    UserService.log.debug('Initializing user service')
    this.loadAuthScheme(app)
    this.registerRoutes(app)
  }

  private loadAuthScheme (app: FastifyInstance): void {
    const opts : FastifyOAuth2Options = {
      name: 'customOauth2',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: '<CLIENT_ID>',
          secret: '<CLIENT_SECRET>'
        },
        auth: {
          authorizeHost: 'https://my-site.com',
          authorizePath: '/authorize',
          tokenHost: 'https://token.my-site.com',
          tokenPath: '/api/token'
        }
      },
      startRedirectPath: '/login',
      callbackUri: 'http://localhost:3000/login/callback',
      callbackUriParams: {
        exampleParam: 'example param value'
      }
    }
    app.register(oauthPlugin, opts)
  }

  private registerRoutes (app: FastifyInstance): void {
    registerUserRoutes(app)
  }

  async start (): Promise<void> {
    this._isAlive = true
    return Promise.resolve()
  }

  stop (): Promise<void> {
    this._isAlive = false
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await this.stop()
    await mongoose.disconnect()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(this._isAlive)
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.resolve(true)
  }

  servesTraffic (): boolean {
    return true
  }
}
