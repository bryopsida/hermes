import config from 'config'

export interface IGlobalConfig {
  getHostname(): string,
  getPort(): number
}

export default {
  buildConfig: (): IGlobalConfig => {
    return {
      getHostname: () => {
        return config.get<string>('hostname')
      },
      getPort: () => {
        return config.get<number>('port')
      }
    }
  }
}
