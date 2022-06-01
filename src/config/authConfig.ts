export enum AuthType {
  // uses a simple embedded database and http basic auth
  // eslint-disable-next-line no-unused-vars
  EMBEDDED = 'embedded',
  // use oidc from an external provider such as keycloak or auth0
  // eslint-disable-next-line no-unused-vars
  EXTERNAL = 'external',
}

export interface IOAuth2Config {
  scope: string[];
  credentials: {
    client: {
      id: string;
      secret: string;
    },
    auth: {
      authorizeHost: string;
      authorizePath: string;
      tokenHost: string;
      tokenPath: string;
    }
  },
  startRedirectPath: string;
  callbackUri: string;
}

export interface IAuthConfig {
  type: AuthType,
  userStorePath?: string,
  externalOauth2Options?: IOAuth2Config
}
