import { Producer } from 'node-rdkafka'
import { FetchTask } from '../../../src/tasks/fetch/fetchTask'
import { IMock, It, Mock, Times } from 'moq.ts'
import { Queue } from 'bull'
import { seedKeys } from '../../../src/common/crypto/seedKeys'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { IDataEncryptor } from '../../../src/common/interfaces/crypto/dataEncryption'
import { CryptoFactory } from '../../../src/factories/cryptoFactory'
import Ioredis, { Redis } from 'ioredis'
import { CredentialType, DataSource } from '../../../src/services/dataSourceManager/dao/dataSource'

/* eslint-disable no-undef */
describe('FetchTask', () => {
  let bull: IMock<Queue<any>>
  let kafka: IMock<Producer>
  let redisClient: Redis
  let redisContainer: StartedTestContainer
  let cryptoInstance: IDataEncryptor

  beforeAll(async () => {
    await seedKeys()
    // start redis container
    redisContainer = await new GenericContainer('redis:latest')
      .withExposedPorts(6379)
      .start()
    redisClient = new Ioredis(redisContainer.getMappedPort(6379), redisContainer.getHost())
    cryptoInstance = CryptoFactory.create({
      scope: 'defaultCrypto',
      redisClient
    })
  })

  beforeEach(() => {
    kafka = new Mock<Producer>()
      .setup(k => k.on(It.Is(val => typeof val === 'string'), It.Is(val => typeof val === 'function'))).returns({} as any)
      .setup(k => k.connect()).returns({} as any)
      .setup(k => k.produce(It.Is(val => val === 'jsonData'), It.Is(val => val == null), It.Is(val => true))).returns({} as any)
    bull = new Mock<Queue<any>>()
      .setup(q => q.process).returns(() => Promise.resolve())
      .setup(q => q.add).returns(() => Promise.resolve({} as any))
  })

  afterAll(async () => {
    redisClient.disconnect(false)
    await redisContainer?.stop({ timeout: 15000 })
  })

  it('can process a data source without credentials', async () => {
    const fTask = new FetchTask(bull.object(), kafka.object(), cryptoInstance)
    // send it to httpbin.org
    const jobDesc = {
      id: 'test',
      timestamp: new Date().getTime(),
      log: () => {},
      queue: {
        name: 'test'
      } as any,
      data: {
        type: 'http',
        name: 'test',
        uri: 'https://httpbin.org/anything',
        properties: {
          method: 'POST'
        }
      }
    } as any
    await fTask.processJob(jobDesc)
    // verify a request was executed and the data was published
    // this uses a echo api so for this test we just check the URI, method and job id are correct
    kafka.verify(k => k.produce(
      It.Is(val => val === 'jsonData'),
      It.Is(val => val == null),
      It.Is((val: Buffer) => {
        const job = JSON.parse(val.toString())
        return job.jobId === 'test' && job.data.url === 'https://httpbin.org/anything' && job.data.method === 'POST'
      }), It.Is(val => typeof val === 'string'), It.Is(val => typeof val === 'number')), Times.Exactly(1))
  })
  it('can process a data source with credentials', async () => {
    const fTask = new FetchTask(bull.object(), kafka.object(), cryptoInstance)
    // we need to get encrypted credentials, create a data source and call init
    // this will encrypt the credentials for us, we need to verify that the published data has correct credentials (plaintext)
    const dataSource = DataSource.fromDTO({
      id: 'test',
      name: 'test',
      type: 'http',
      uri: 'https://httpbin.org/anything',
      tags: [],
      hasCredentials: true,
      credentials: {
        username: 'test',
        password: 'test',
        type: CredentialType.BASIC
      }
    })
    await dataSource.init(cryptoInstance)

    // send it to httpbin.org
    const jobDesc = {
      id: 'test',
      timestamp: new Date().getTime(),
      log: () => {},
      queue: {
        name: 'test'
      } as any,
      data: {
        id: 'test',
        type: 'http',
        name: 'test',
        uri: 'https://httpbin.org/anything',
        properties: {
          method: 'POST',
          credentials: dataSource.credentials
        }
      }
    } as any
    await fTask.processJob(jobDesc)
    // verify a request was executed and the data was published
    // this uses a echo api so for this test we just check the URI, method and job id are correct
    kafka.verify(k => k.produce(
      It.Is(val => val === 'jsonData'),
      It.Is(val => val == null),
      It.Is((val: Buffer) => {
        const job = JSON.parse(val.toString())
        const authHeader = job.data.headers.Authorization
        const expectedAuthHeader = 'Basic ' + Buffer.from('test:test').toString('base64')
        return job.jobId === 'test' && job.data.url === 'https://httpbin.org/anything' && job.data.method === 'POST' && authHeader === expectedAuthHeader
      }), It.Is(val => typeof val === 'string'), It.Is(val => typeof val === 'number')), Times.Exactly(1))
  })
  it('can process a data source with credentials and a header map', async () => {
    const fTask = new FetchTask(bull.object(), kafka.object(), cryptoInstance)
    // we need to get encrypted credentials, create a data source and call init
    // this will encrypt the credentials for us, we need to verify that the published data has correct credentials (plaintext)
    const dataSource = DataSource.fromDTO({
      id: 'test',
      name: 'test',
      type: 'http',
      uri: 'https://httpbin.org/anything',
      tags: [],
      hasCredentials: true,
      credentials: {
        username: 'test',
        password: 'test',
        type: CredentialType.BASIC,
        headers: {
          'X-Test-1': 'test1',
          'X-Test-2': 'test2'
        }
      }
    })
    await dataSource.init(cryptoInstance)

    // send it to httpbin.org
    const jobDesc = {
      id: 'test',
      timestamp: new Date().getTime(),
      log: () => {},
      queue: {
        name: 'test'
      } as any,
      data: {
        id: 'test',
        type: 'http',
        name: 'test',
        uri: 'https://httpbin.org/anything',
        properties: {
          method: 'POST',
          credentials: dataSource.credentials
        }
      }
    } as any
    await fTask.processJob(jobDesc)
    // verify a request was executed and the data was published
    // this uses a echo api so for this test we just check the URI, method and job id are correct
    kafka.verify(k => k.produce(
      It.Is(val => val === 'jsonData'),
      It.Is(val => val == null),
      It.Is((val: Buffer) => {
        const job = JSON.parse(val.toString())
        const authHeader = job.data.headers.Authorization
        const expectedAuthHeader = 'Basic ' + Buffer.from('test:test').toString('base64')
        return job.jobId === 'test' && job.data.url === 'https://httpbin.org/anything' && job.data.method === 'POST' && authHeader === expectedAuthHeader &&
          job.data.headers['X-Test-1'] === 'test1' && job.data.headers['X-Test-2'] === 'test2'
      }), It.Is(val => typeof val === 'string'), It.Is(val => typeof val === 'number')), Times.Exactly(1))
  })
})
