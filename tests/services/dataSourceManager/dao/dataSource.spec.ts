import { randomUUID } from 'crypto'
import { StartedTestContainer, GenericContainer } from 'testcontainers'
import { CryptoCreateOptions, CryptoFactory } from '../../../../src/factories/cryptoFactory'
import { CryptoRegistry, CryptoRegistrySingleton } from '../../../../src/registries/cryptoRegistry'
import { CredentialType, DataSource } from '../../../../src/services/dataSourceManager/dao/dataSource'
import { DataSourceDTO } from '../../../../src/services/dataSourceManager/dto/dataSource'
import Redis from 'ioredis'
import { Crypto } from '../../../../src/common/crypto/crypto'

// uses a mongodb and redis test container, does not mock those services

/* eslint-disable no-undef */
describe('DataSource DAO', () => {
  let redisContainer: StartedTestContainer
  let mongoContainer: StartedTestContainer
  let cryptoInstance: Crypto

  beforeAll(async () => {
    // start redis container
    redisContainer = await new GenericContainer('redis:latest')
      .withExposedPorts(6379)
      .start()

    mongoContainer = await new GenericContainer('mongo:latest')
      .withEnv('MONGO_INITDB_ROOT_USERNAME', 'mongodb')
      .withEnv('MONGO_INITDB_ROOT_PASSWORD', 'mongodb')
      .withExposedPorts(27017)
      .start()

    // set mongoose url, this overrides default specified via config
    DataSource.setMongooseUrl(`mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}/data_sources`)

    const opts: CryptoCreateOptions = {
      scope: 'defaultCrypto',
      redisClient: new Redis(redisContainer.getMappedPort(6379), redisContainer.getHost())
    }
    // seed crypto instance before reference fetched
    cryptoInstance = await CryptoRegistrySingleton.getInstance().set('defaultCrypto', CryptoFactory.create(opts))
  })
  afterAll(async () => {
    await cryptoInstance.close()
    await redisContainer?.stop({ timeout: 15000 })
    await mongoContainer?.stop({ timeout: 15000 })
  })
  it('can manage a data source in the backing data store', async () => {
    const id = randomUUID()
    const dataSource: DataSourceDTO = {
      id,
      type: 'test',
      name: 'test',
      uri: 'http://google.com',
      tags: [],
      hasCredentials: false
    }
    const dao = DataSource.fromDTO(dataSource)
    await DataSource.upsert(dao)
    const fetchedDataSource = await DataSource.findById(id)
    expect(fetchedDataSource.toDTO()).toEqual(dataSource)
  })
  it('can manage a data source with credentials', async () => {
    const id = randomUUID()
    const dataSource: DataSourceDTO = {
      id,
      type: 'test',
      name: 'test',
      uri: 'http://google.com',
      tags: [],
      hasCredentials: true,
      credentials: {
        username: 'test',
        password: 'test',
        type: CredentialType.BASIC
      }
    }
    const dao = DataSource.fromDTO(dataSource)
    await DataSource.upsert(dao)
    const fetchedDataSource = await DataSource.findById(id)
    expect(fetchedDataSource.toDTO(true)).toEqual(dataSource)
  })
})
