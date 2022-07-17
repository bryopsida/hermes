import { Crypto } from '../common/crypto/crypto'
import config from 'config'
import { IKeyStore } from '../common/interfaces/crypto/dataEncryption'
import { CryptoKeyStoreFactory, KeyStoreType } from './keyStoreFactory'
import { Cluster, Redis } from 'ioredis'

export interface CryptoCreateOptions {
  scope: string
  keyStore?: IKeyStore
  redisClient?: Redis | Cluster
}

export class CryptoFactory {
  static create (opts: CryptoCreateOptions): Crypto {
    const masterKeyPath = config.get<string>(`${opts.scope}.masterKeyPath`)
    const masterKeyContext = config.get<string>(`${opts.scope}.masterContextPath`)
    return new Crypto(opts.keyStore || CryptoKeyStoreFactory.create({
      type: config.get<KeyStoreType>(`${opts.scope}.store.type`),
      configScope: `${opts.scope}.store`,
      redisClient: opts.redisClient
    }), masterKeyPath, masterKeyContext)
  }
}
