import config from 'config'

export interface IRedisConfig {
  host: string;
  port: number;
  password: string;
  cluster: boolean;
}

export default {
  buildConfig: (scope: string): IRedisConfig => {
    return config.get<IRedisConfig>(`${scope}.redis`)
  }
}
