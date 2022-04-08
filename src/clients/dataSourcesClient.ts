import { Logger } from 'pino'
import { IPaginatedResponse } from '../common/models/paginatedResponse'
import { DataSourceDTO } from '../services/dataSourceManager/dto/dataSource'
import axios from 'axios'

export class DataSourceClient {
  private readonly logger:Logger|undefined;

  constructor (private readonly baseUrl: string, loggerEnabled: boolean = false) {
    if (loggerEnabled) {
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

  public async getDataSources (offset: number, count: number) : Promise<IPaginatedResponse<DataSourceDTO>> {
    if (offset == null || isNaN(offset)) {
      offset = 0
    }
    if (count == null || isNaN(count)) {
      count = 100
    }
    const url = `${this.baseUrl}/sources?offset=${offset}&limit=${count}`
    this.logger?.debug(`Fetching data sources from url: ${url}`)
    const response = await axios.get<IPaginatedResponse<DataSourceDTO>>(url)
    return response.data
  }

  public async applyDataSource (dataSource: DataSourceDTO) : Promise<DataSourceDTO> {
    const url = `${this.baseUrl}/sources/${dataSource.id}`
    this.logger?.debug(`Adding data source to: ${url}`)
    const response = await axios.put<DataSourceDTO>(url, dataSource)
    this.logger?.info(`Data source ${dataSource.id} added, result = ${JSON.stringify(response.data)}`)
    return response.data
  }

  public async removeDataSource (dataSourceId: string) : Promise<void> {
    const url = `${this.baseUrl}/sources/${dataSourceId}`
    this.logger?.debug(`Removing data source from: ${url}`)
    await axios.delete(url)
  }

  public async getDataSource (dataSourceId: string) : Promise<DataSourceDTO> {
    const url = `${this.baseUrl}/sources/${dataSourceId}`
    this.logger?.debug(`Fetching data source from: ${url}`)
    const response = await axios.get<DataSourceDTO>(url)
    return response.data
  }
}
