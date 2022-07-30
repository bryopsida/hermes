import { IConfig } from 'config'
import { CredentialProvider } from '../common/interfaces/client'
import { AuthType, IAuthConfig } from '../config/authConfig'
import { AxiosRequestConfig } from 'axios'

export class ClientCredentialProviderFactory {
  static create (config: IConfig, scopeOptions?: Record<string, any>): CredentialProvider {
    const authConfig :IAuthConfig = config.get<IAuthConfig>('auth')
    if (authConfig.type === AuthType.EMBEDDED) {
      return (axiosOptions: AxiosRequestConfig) => {
        const scope = scopeOptions?.scope || 'task_runner.tasks.fetch'
        const username = scopeOptions?.usernameKey || 'username'
        const password = scopeOptions?.passwordKey || 'password'

        axiosOptions.auth = {
          username: config.get<string>(`${scope}.${username}`),
          password: config.get<string>(`${scope}.${password}`)
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
