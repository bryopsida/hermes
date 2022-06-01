import { AxiosRequestConfig } from 'axios'

export interface CredentialProvider {
  (axiosOptions: AxiosRequestConfig) : Promise<AxiosRequestConfig | undefined>
}

export interface ClientOptions {
  baseUrl: string
  credentialProvider?: CredentialProvider
  loggerEnabled?: boolean
}
