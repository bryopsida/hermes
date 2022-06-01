import { FastifyInstance, onRequestHookHandler, preHandlerHookHandler, preValidationHookHandler } from 'fastify'
import { EmbeddedAuthentication } from '../../common/embeddedAuthentication'
import config from 'config'
import { AuthType, IAuthConfig } from '../../config/authConfig'
import oauth2Plugin, { FastifyOAuth2Options } from '@fastify/oauth2'
import fastifyAuth from '@fastify/auth'
import fastifyBasicAuth, { FastifyBasicAuthOptions } from '@fastify/basic-auth'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    verifyCredentials: onRequestHookHandler |
      preValidationHookHandler |
      preHandlerHookHandler
  }
}

export class AuthenticationDecorator {
  /**
   * Creates an embedded authentication middleware that loads a json file defining the users and caches it
   * for http basic auth, setups the necessary middleware on the fastify app instance to enforce this.
   * @param app : FastifyInstance
   * @param authConfig : IAuthConfig
   * @returns IAuthentication
   */
  private static decorateEmbeddedAuthentication (app: FastifyInstance, authConfig: IAuthConfig) : void {
    if (!authConfig.userStorePath) {
      throw new Error('No user store path defined')
    }
    const embeddedAuth = new EmbeddedAuthentication(authConfig.userStorePath)
    const authOptions : FastifyBasicAuthOptions = {
      authenticate: {
        realm: 'hermes'
      },
      validate: embeddedAuth.authenticate.bind(embeddedAuth)
    }
    // this adds a decoration at basicAuth on the fastify instance,
    // we need to join this to verifyAuth so we can abstract routes from
    // requiring specific auth types
    app.register(fastifyBasicAuth, authOptions)
    app.after(() => {
      app.decorate('verifyCredentials', app.basicAuth)
    })
  }

  /**
   * Decorates the fastify instance with the oauth2 plugin configured matching
   * the provided auth config
   * @param app | FastifyInstance
   * @param authConfig | IAuthConfig
   */
  public static decorateExternalAuthentication (app: FastifyInstance, authConfig: IAuthConfig) : void {
    if (authConfig.externalOauth2Options == null) {
      throw new Error('No external oauth2 options defined')
    }
    // use existing plugin and just config it
    const opts : FastifyOAuth2Options = {
      ...authConfig.externalOauth2Options,
      ...{
        name: 'customOauth2'
      }
    }
    app.register(oauth2Plugin, opts)
    app.after(() => {
      app.decorate('verifyCredentials', (app as any).customOauth2)
    })
  }

  /**
   * Decorate the fastify app instance with the neceessary changes to enforce the desired authentication
   * scheme
   * @param app | FastifyInstance
   * @returns IAuthentication
   */
  public static decorate (
    app: FastifyInstance
  ): void {
    // this handles abstracting the auth plugin from the route registration logic
    // we can registr this once and then map it to either oauth2 or http basic based
    // on configuration, registration of speciific plugins should happen in the
    // the specific method for the decoration
    app.register(fastifyAuth)
    const authConfig = config.get<IAuthConfig>('auth')
    switch (authConfig.type) {
      case AuthType.EMBEDDED:
        return AuthenticationDecorator.decorateEmbeddedAuthentication(app, authConfig)
      default:
        return AuthenticationDecorator.decorateExternalAuthentication(app, authConfig)
    }
  }
}
