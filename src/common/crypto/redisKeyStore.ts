import { BaseKeyStore, IKeyStoreContextProvider, IKeyStoreValueProvider } from './baseKeyStore'
import { Redis, Cluster } from 'ioredis'
import createLogger from '../logger/factory'
import computedConstants from '../computedConstants'

export class RedisKeyStore extends BaseKeyStore {
  private readonly redisClient: Redis | Cluster
  private readonly keyPrefix: string
  private static readonly logger = createLogger({
    serviceName: `redis-key-store-${computedConstants.id}`,
    level: 'info'
  })

  constructor (redisClient: Redis | Cluster, keyPrefix: string, keyStorePasswordProvider: IKeyStoreValueProvider, keyStoreSaltProvider: IKeyStoreValueProvider, keyStoreContextProvider: IKeyStoreContextProvider) {
    super(keyStorePasswordProvider, keyStoreSaltProvider, keyStoreContextProvider)
    this.redisClient = redisClient
    this.keyPrefix = keyPrefix || 'hermes-key-store'
  }

  protected async putKeyInSlot (keySlot: string, key: Buffer): Promise<void> {
    RedisKeyStore.logger.info(`Putting key in slot ${this.keyPrefix}:${keySlot}`)
    await this.redisClient.set(`{${this.keyPrefix}:${keySlot}}`, key.toString('base64'))
  }

  protected async getKeyInSlot (keySlot: string): Promise<Buffer> {
    RedisKeyStore.logger.info(`Getting key in slot ${this.keyPrefix}:${keySlot}`)
    const val = await this.redisClient.get(`{${this.keyPrefix}:${keySlot}}`)
    if (val) {
      return Buffer.from(val, 'base64')
    } else {
      throw new Error('Key not found')
    }
  }

  protected async deleteKeySlot (keySlot: string): Promise<void> {
    await this.redisClient.del(`{${this.keyPrefix}:${keySlot}}`)
  }

  protected async clearKeySlots (): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const pattern = `{${this.keyPrefix}:*`
        RedisKeyStore.logger.info(`Clearing keys matching pattern ${pattern}`)
        const scanStream = this.redisClient.scanStream({
          match: pattern
        })
        scanStream.on('data', (keys: string[]) => {
          RedisKeyStore.logger.info(`Deleting ${keys.length} keys`)
          keys.forEach(key => {
            this.redisClient.del(key)
          })
        })
        const timeout = setTimeout(() => {
          scanStream.destroy()
          reject(new Error('Timeout while clearing keys'))
        }, 10000)
        scanStream.on('end', () => {
          RedisKeyStore.logger.info('Finished scanning keys for deletion')
          clearTimeout(timeout)
          resolve()
        })
        scanStream.on('error', (err: Error) => {
          RedisKeyStore.logger.error('Error while scanning keys for deletion', err)
          clearTimeout(timeout)
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  protected async hasKeyInSlot (keySlot: string): Promise<boolean> {
    return (await this.redisClient.exists(`{${this.keyPrefix}:${keySlot}}`)) > 0
  }

  async close (): Promise<void> {
    RedisKeyStore.logger.info('Closing redis client')
    this.redisClient.disconnect(false)
  }
}
