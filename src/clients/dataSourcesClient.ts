import { Logger } from 'pino'
import computedConstants from '../common/computedConstants'
import createLogger from '../common/logger/factory'
import { IPaginatedResponse } from '../common/models/paginatedResponse'
import { DataSourceDTO } from '../services/dataSources/dto/dataSource'
import axios from 'axios'

export class DataSourceClient {
  private readonly logger:Logger;

  constructor (private readonly baseUrl: string) {
    this.logger = createLogger({
      serviceName: `data-source-client-${computedConstants.id}`,
      level: 'debug'
    })
  }

  public async getDataSources (offset: number, count: number) : Promise<IPaginatedResponse<DataSourceDTO>> {
    const url = `${this.baseUrl}/sources?offset=${offset}&count=${count}`
    this.logger.debug(`Fetching data sources from url: ${url}`)
    const response = await axios.get<{
      data: IPaginatedResponse<DataSourceDTO>
    }>(url)
    return response.data.data
  }
}
