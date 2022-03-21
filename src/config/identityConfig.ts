import config from 'config'

export interface IIdentityConfig {
  readonly baseUrl: string;
}
export class IdentifyConfigFactory {
  public static buildConfig (scope: string): IIdentityConfig {
    return {
      baseUrl: config.get<string>(`${scope}.identity.baseUrl`)
    }
  }
}
