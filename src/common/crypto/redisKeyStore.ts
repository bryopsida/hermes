import { BaseKeyStore, IKeyStoreContextProvider, IKeyStoreValueProvider } from './baseKeyStore'
import { Redis, Cluster } from 'ioredis'

export class RedisKeyStore extends BaseKeyStore {
  private readonly redisClient: Redis | Cluster
  private readonly keyPrefix: string

  constructor (redisClient: Redis | Cluster, keyPrefix: string, keyStorePasswordProvider: IKeyStoreValueProvider, keyStoreSaltProvider: IKeyStoreValueProvider, keyStoreContextProvider: IKeyStoreContextProvider) {
    super(keyStorePasswordProvider, keyStoreSaltProvider, keyStoreContextProvider)
    this.redisClient = redisClient
    this.keyPrefix = keyPrefix
  }

  protected async putKeyInSlot (keySlot: string, key: Buffer): Promise<void> {
    await this.redisClient.set(`{${this.keyPrefix}:${keySlot}}`, key)
  }

  protected async getKeyInSlot (keySlot: string): Promise<Buffer> {
    const val = await this.redisClient.get(`{${this.keyPrefix}:${keySlot}}`)
    if (val) {
      return Buffer.from(val, 'hex')
    } else {
      throw new Error('Key not found')
    }
  }

  protected async deleteKeySlot (keySlot: string): Promise<void> {
    await this.redisClient.del(`{${this.keyPrefix}:${keySlot}}`)
  }

  protected async clearKeySlots (): Promise<void> {
    await this.redisClient.del(`{${this.keyPrefix}:*}`)
  }

  protected async hasKeyInSlot (keySlot: string): Promise<boolean> {
    return (await this.redisClient.exists(`{${this.keyPrefix}:${keySlot}}`)) > 0
  }

  async close (): Promise<void> {
    this.redisClient.disconnect(false)
  }
}
