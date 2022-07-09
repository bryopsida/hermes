import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { RedisKeyStore } from '../../../src/common/crypto/redisKeyStore'
import Redis from 'ioredis'
import { randomBytes, randomUUID } from 'crypto'
import { IKeyStore } from '../../../src/common/interfaces/crypto/dataEncryption'

/* eslint-disable no-undef */
describe('RedisKeyStore', () => {
  let redisContainer: StartedTestContainer
  let keyStore: IKeyStore
  let password: Buffer
  let salt: Buffer
  let context: Buffer

  beforeAll(async () => {
    // start redis container
    redisContainer = await new GenericContainer('redis:latest')
      .withExposedPorts(6379)
      .start()
  })

  afterAll(async () => {
    // stop redis container
    await redisContainer?.stop()
  })

  beforeEach(async () => {
    // create key store
    const client = new Redis(redisContainer.getMappedPort(6379), redisContainer.getHost())
    password = randomBytes(32)
    salt = randomBytes(16)
    context = randomBytes(32)
    keyStore = new RedisKeyStore(client, randomUUID(), () => Promise.resolve(password), () => Promise.resolve(salt), () => Promise.resolve(context))
  })
  afterEach(async () => {
    // close key store
    await keyStore.close()
  })

  it('can manage a DEK', async () => {
    // create random data to act as key store
    const dek = randomBytes(32)
    const id = randomUUID()

    // save it
    await keyStore.saveSealedDataEncKey(id, dek)

    // ask for it back
    const fetchedDek = await keyStore.fetchSealedDataEncKey(id)

    // should be the same
    expect(fetchedDek).toEqual(dek)

    // delete it
    await keyStore.destroySealedDataEncKey(id)

    // shouldn't be able to fetch it
    await expect(keyStore.fetchSealedDataEncKey(id)).rejects.toThrow()
  })
  it('can manage a root key', async () => {
    // create random data to act as key store
    const rootKey = randomBytes(32)
    const id = randomUUID()

    // save it
    await keyStore.saveSealedRootKey(id, rootKey)

    // ask for it back
    const fetched = await keyStore.fetchSealedRootKey(id)

    // should be the same
    expect(fetched).toEqual(rootKey)

    // delete it
    await keyStore.destroySealedRootKey(id)

    // shouldn't be able to fetch it
    await expect(keyStore.fetchSealedRootKey(id)).rejects.toThrow()
  })
  it('can shred all the keys', async () => {
    // create random data to act as key store
    const rootKey = randomBytes(32)
    const id = randomUUID()

    // save it
    await keyStore.saveSealedRootKey(id, rootKey)

    // ask for it back
    const fetched = await keyStore.fetchSealedRootKey(id)

    // should be the same
    expect(fetched).toEqual(rootKey)

    // delete all the keys
    await keyStore.destroyAllKeys()

    // shouldn't be able to fetch it
    await expect(keyStore.fetchSealedRootKey(id)).rejects.toThrow()
  })
  it('fails when salt changes', async () => {
    // create random data to act as key store
    const rootKey = randomBytes(32)
    const id = randomUUID()

    // save it
    await keyStore.saveSealedRootKey(id, rootKey)

    // ask for it back
    const fetched = await keyStore.fetchSealedRootKey(id)

    // should be the same
    expect(fetched).toEqual(rootKey)

    // change the salt
    salt = randomBytes(16)

    // shouldn't be able to fetch it
    await expect(keyStore.fetchSealedRootKey(id)).rejects.toThrow()
  })
  it('fails when context changes', async () => {
    // create random data to act as key store
    const rootKey = randomBytes(32)
    const id = randomUUID()

    // save it
    await keyStore.saveSealedRootKey(id, rootKey)

    // ask for it back
    const fetched = await keyStore.fetchSealedRootKey(id)

    // should be the same
    expect(fetched).toEqual(rootKey)

    // change the context
    context = randomBytes(32)

    // shouldn't be able to fetch it
    await expect(keyStore.fetchSealedRootKey(id)).rejects.toThrow()
  })
  it('fails when password changes', async () => {
    // create random data to act as key store
    const rootKey = randomBytes(32)
    const id = randomUUID()

    // save it
    await keyStore.saveSealedRootKey(id, rootKey)

    // ask for it back
    const fetched = await keyStore.fetchSealedRootKey(id)

    // should be the same
    expect(fetched).toEqual(rootKey)

    // change the password
    password = randomBytes(32)

    // shouldn't be able to fetch it
    await expect(keyStore.fetchSealedRootKey(id)).rejects.toThrow()
  })
})
