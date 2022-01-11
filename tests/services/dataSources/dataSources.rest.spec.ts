/* eslint-disable no-undef */
import 'jest'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { DataSourceDTO } from '../../../src/services/dataSources/dto/dataSource'
import testConfig from '../../helpers/testConfiguration'

const baseUrl = `${testConfig.proto}://${testConfig.host}:${testConfig.port}`
const testUrl = `${baseUrl}/api/data_sources/v1`

describe('DataSource.Rest', () => {
  it('can manage a data source', async () => {
    const id = randomUUID()

    // create
    const response = await axios.put(`${testUrl}/sources/${id}`, {
      id: id,
      type: 'test',
      name: 'test',
      uri: 'http://google.com'
    } as DataSourceDTO)
    expect(response.status).toBe(200)

    // fetch
    const dataSource = await (await axios.get(`${testUrl}/sources/${id}`)).data
    expect(dataSource.id).toBe(id)
  })
})
