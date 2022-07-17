import { randomUUID } from 'crypto'
import { StartedTestContainer, GenericContainer } from 'testcontainers'
import { CryptoCreateOptions, CryptoFactory } from '../../../../src/factories/cryptoFactory'
import { CredentialType, DataSource } from '../../../../src/services/dataSourceManager/dao/dataSource'
import { DataSourceDTO } from '../../../../src/services/dataSourceManager/dto/dataSource'
import Redis from 'ioredis'
import { Crypto } from '../../../../src/common/crypto/crypto'
import { Mongoose, connect } from 'mongoose'
import { seedKeys } from '../../../../src/common/crypto/seedKeys'

// uses a mongodb and redis test container, does not mock those services

/* eslint-disable no-undef */
describe('DataSource DAO', () => {
  let redisContainer: StartedTestContainer
  let mongoContainer: StartedTestContainer
  let cryptoInstance: Crypto
  let mongoose: Mongoose

  beforeAll(async () => {
    await seedKeys()
    // start redis container
    redisContainer = await new GenericContainer('redis:latest')
      .withExposedPorts(6379)
      .start()

    mongoContainer = await new GenericContainer('mongo:latest')
      .withEnv('MONGO_INITDB_ROOT_USERNAME', 'mongodb')
      .withEnv('MONGO_INITDB_ROOT_PASSWORD', 'mongodb')
      .withExposedPorts(27017)
      .start()

    const opts: CryptoCreateOptions = {
      scope: 'defaultCrypto',
      redisClient: new Redis(redisContainer.getMappedPort(6379), redisContainer.getHost())
    }
    // seed crypto instance before reference fetched
    cryptoInstance = CryptoFactory.create(opts)
    mongoose = await connect(`mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}/data_sources`, {
      user: 'mongodb',
      pass: 'mongodb',
      dbName: 'data_sources',
      authSource: 'admin'
    })
  })
  afterAll(async () => {
    await mongoose.connection.close()
    await cryptoInstance.close()
    const redisLogs = await redisContainer.logs()
    redisLogs.destroy()
    const mongoLogs = await mongoContainer.logs()
    mongoLogs.destroy()
    await redisContainer?.stop({ timeout: 15000 })
    await mongoContainer?.stop({ timeout: 15000 })
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
    await DataSource.upsert(mongoose.connection, cryptoInstance, dao)
    const fetchedDataSource = await DataSource.findById(mongoose.connection, id)
    expect(fetchedDataSource.toDTO(true)).toEqual(dataSource)
  })
})
