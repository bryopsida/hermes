/* eslint-disable no-undef */
import 'jest'
import { randomUUID } from 'crypto'
import axios from 'axios'
import { WatchDTO } from '../../../src/services/watchManagement/dto/watch'
import testConfig from '../../helpers/testConfiguration'

const baseUrl = `${testConfig.proto}://${testConfig.host}:${testConfig.port}`
const testUrl = `${baseUrl}/api/watch_management/v1`

describe('WatchManagement.Rest', () => {
  it('can manage a watch', async () => {
    const id = randomUUID()

    // create
    const response = await axios.put(`${testUrl}/watches/${id}`, {
      id: id,
      name: 'test',
      description: 'test',
      graphql: 'test'
    } as WatchDTO)
    expect(response.status).toBe(200)

    // fetch
    const dataSource = await (await axios.get(`${testUrl}/watches/${id}`)).data
    expect(dataSource.id).toBe(id)
  })
})
