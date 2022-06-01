import { IConfig } from 'config'
import { CredentialProvider } from '../common/interfaces/client'
import { AuthType, IAuthConfig } from '../config/authConfig'
import { AxiosRequestConfig } from 'axios'

export class ClientCredentialProviderFactory {
  static create (config: IConfig): CredentialProvider {
    const authConfig :IAuthConfig = config.get<IAuthConfig>('auth')
    if (authConfig.type === AuthType.EMBEDDED) {
      return (axiosOptions: AxiosRequestConfig) => {
        axiosOptions.auth = {
          username: config.get<string>('task_runner.tasks.fetch.username'),
          password: config.get<string>('task_runner.tasks.fetch.password')
        }
        return Promise.resolve(axiosOptions)
      }
    } else {
      return (axiosOptions: AxiosRequestConfig) => {
        return Promise.resolve(axiosOptions)
      }
    }
  }
}
