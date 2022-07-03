import { Crypto } from '../common/crypto/crypto'
import config from 'config'
import { IKeyStore } from '../common/interfaces/crypto/dataEncryption'
import { CryptoKeyStoreFactory, KeyStoreType } from './keyStoreFactory'
import { Cluster, Redis } from 'ioredis'
export class CryptoFactory {
  static create (scope: string, keyStore: IKeyStore | undefined, redisClient: Redis|Cluster): Crypto {
    const masterKeyPath = config.get<string>(`${scope}.masterKeyPath`)
    const masterKeyContext = config.get<string>(`${scope}.masterKeyContext`)
    return new Crypto(keyStore || CryptoKeyStoreFactory.create({
      type: config.get<KeyStoreType>(`${scope}.store.type`),
      configScope: `${scope}.store`,
      redisClient
    }), masterKeyPath, masterKeyContext)
  }
}
