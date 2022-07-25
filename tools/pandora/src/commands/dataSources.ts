import { Writable } from 'stream'
import { DataSourceClient } from '../../../../src/clients/dataSourcesClient'
import { IPaginatedResponse } from '../../../../src/common/models/paginatedResponse'
import { DataSourceDTO } from '../../../../src/services/dataSourceManager/dto/dataSource'

export class DataSourceCommand {
  private readonly dataSourceClient: DataSourceClient

  constructor (dataSourceClient: DataSourceClient) {
    this.dataSourceClient = dataSourceClient
  }

  private async printHeaders (stream: Writable) : Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(`${'ID'.padEnd(48)}${'NAME'.padEnd(32)}${'Type'.padEnd(12)}${'Uri'.padEnd(64)}\n`, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private printDataSource (stream: Writable, dataSource: DataSourceDTO) : Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(`${dataSource.id.padEnd(48)}${dataSource.name.padEnd(32)}${dataSource.type.padEnd(12)}${dataSource.uri.padEnd(64)}\n`, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private printDataSourcePage (stream: Writable, paginatedResponse : IPaginatedResponse<DataSourceDTO>) : Promise<unknown> {
    return Promise.all(paginatedResponse.items?.map((dataSource) => this.printDataSource(stream, dataSource)))
  }

  async getDataSources (stream: Writable) : Promise<void> {
    let done = false
    let firstWrite = true
    let offset = 0
    const count = 100
    do {
      const response = await this.dataSourceClient.getDataSources(offset, count)
      if (!response) {
        done = true
        console.error('Failed to get data sources, empty response')
        process.exit(2)
      }
      if (response.totalCount === 0) {
        done = true
        console.log('No data sources found')
        continue
      }
      if (firstWrite) {
        firstWrite = false
        await this.printHeaders(stream)
      }
      await this.printDataSourcePage(stream, response)
      if (response.items.length !== count) {
        done = true
      } else {
        offset += count
      }
    } while (!done)
  }

  async addDataSource (stream: Writable, dataSource: DataSourceDTO) : Promise<void> {
    const response = await this.dataSourceClient.applyDataSource(dataSource)
    if (!response) {
      console.error('Failed to add data source, empty response')
      process.exit(2)
    }
    await this.printHeaders(stream)
    await this.printDataSource(stream, response)
  }

  async removeDataSource (dataSourceId: string) : Promise<void> {
    await this.dataSourceClient.removeDataSource(dataSourceId)
  }
}
