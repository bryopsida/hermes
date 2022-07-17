import { Logger } from 'pino'
import { IPaginatedResponse } from '../common/models/paginatedResponse'
import { DataSourceDTO } from '../services/dataSourceManager/dto/dataSource'
import axios, { AxiosRequestConfig } from 'axios'
import { ClientOptions, CredentialProvider } from '../common/interfaces/client'

export class DataSourceClient {
  private readonly logger: Logger | undefined
  private readonly baseUrl: string
  private readonly loggerEnabled
  private readonly credentialProvider: CredentialProvider | undefined

  constructor (options: ClientOptions) {
    this.baseUrl = options.baseUrl
    this.loggerEnabled = options.loggerEnabled === true
    this.credentialProvider = options.credentialProvider

    if (this.loggerEnabled) {
      const createLogger = require('../common/logger/factory')
      const computedConstants = require('../common/computedConstants')
      this.logger = createLogger({
        serviceName: `data-source-client-${computedConstants.id}`,
        level: 'debug'
      })
    } else {
      this.logger = undefined
    }
  }

  private async getAxiosRequestOptions (): Promise<AxiosRequestConfig|undefined> {
    if (this.credentialProvider) {
      return this.credentialProvider({})
    }
    return Promise.resolve(undefined)
  }

  public async getDataSources (offset: number, count: number): Promise<IPaginatedResponse<DataSourceDTO>> {
    if (offset == null || isNaN(offset)) {
      offset = 0
    }
    if (count == null || isNaN(count)) {
      count = 100
    }
    const url = `${this.baseUrl}/sources?offset=${offset}&limit=${count}`
    this.logger?.debug(`Fetching data sources from url: ${url}`)
    const reqOpts = await this.getAxiosRequestOptions()
    const response = await axios.get<IPaginatedResponse<DataSourceDTO>>(url, reqOpts)
    return response.data
  }

  public async applyDataSource (dataSource: DataSourceDTO): Promise<DataSourceDTO> {
    const url = `${this.baseUrl}/sources/${dataSource.id}`
    this.logger?.debug(`Adding data source to: ${url}`)
    const response = await axios.put<DataSourceDTO>(url, dataSource, await this.getAxiosRequestOptions())
    this.logger?.info(`Data source ${dataSource.id} added, result = ${JSON.stringify(response.data)}`)
    return response.data
  }

  public async removeDataSource (dataSourceId: string): Promise<void> {
    const url = `${this.baseUrl}/sources/${dataSourceId}`
    this.logger?.debug(`Removing data source from: ${url}`)
    await axios.delete(url, await this.getAxiosRequestOptions())
  }

  public async getDataSource (dataSourceId: string, includeCredentials?: boolean): Promise<DataSourceDTO> {
    const url = `${this.baseUrl}/sources/${dataSourceId}`
    this.logger?.debug(`Fetching data source from: ${url}`)
    const response = await axios.get<DataSourceDTO>(url, {
      params: {
        includeCredentials: includeCredentials ? 'true' : 'false'
      },
      ...(await this.getAxiosRequestOptions())
    })
    return response.data
  }
}
