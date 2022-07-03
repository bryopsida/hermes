import { Cluster, Redis } from 'ioredis'
import { Crypto } from '../common/crypto/crypto'
import { IUsableClosable } from '../common/using'
import { CryptoFactory } from '../factories/cryptoFactory'
import { BaseRegistry } from './baseRegistry'

export class RedisClientWrapper implements IUsableClosable {
  private redisClient: Redis | Cluster
  constructor (redisClient: Redis | Cluster) {
    this.redisClient = redisClient
  }

  public async close () : Promise<void> {
    this.redisClient.disconnect(false)
    return Promise.resolve()
  }
}

export class CryptoRegistry extends BaseRegistry<Crypto> {
  build (id: string): Promise<Crypto> {
    // build a fresh crypto store, the id is the configuration scope
    // peak the config to figure out the type of store
    return Promise.resolve(CryptoFactory.create({ scope: id }))
  }
}

export class CryptoRegistrySingleton {
  private static instance: CryptoRegistry
  static getInstance (): CryptoRegistry {
    if (!CryptoRegistrySingleton.instance) {
      CryptoRegistrySingleton.instance = new CryptoRegistry()
    }
    return CryptoRegistrySingleton.instance
  }
}
