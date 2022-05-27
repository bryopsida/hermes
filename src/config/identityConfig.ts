import config from 'config'

export interface IIdentityConfig {
  readonly mountPath: string;
  readonly issuer: string;
  readonly providerConfig: any;
}
export class IdentifyConfigFactory {
  public static buildConfig (scope: string): IIdentityConfig {
    return {
      mountPath: config.get<string>(`${scope}.mountPath`),
      issuer: config.get<string>(`${scope}.issuer`),
      providerConfig: config.get<any>(`${scope}.providerConfig`)
    }
  }
}
