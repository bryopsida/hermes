import { FileKeyStore } from '../common/crypto/fileKeyStore'
import { IKeyStore } from '../common/interfaces/crypto/dataEncryption'
import config from 'config'
import { RedisKeyStore } from '../common/crypto/redisKeyStore'
import { Cluster, Redis } from 'ioredis'
import { RedisClientFactory } from './redisClientFactory'

export enum KeyStoreType {
  // eslint-disable-next-line no-unused-vars
  EMBEDDED = 'embedded',
  // eslint-disable-next-line no-unused-vars
  REDIS = 'redis'
}

export interface KeyStoreDescription {
  type: KeyStoreType
  configScope: string,
  redisClient?: Redis | Cluster
}

export interface KeyStoreOptions {
  password: string
  salt: string
  context: string
}

export interface FileKeyStoreOptions extends KeyStoreOptions {
  path: string
}

export interface RedisKeyStoreOptions extends KeyStoreOptions {
  keyPrefix: string
}

interface KeyStoreValueProvider {
  passwordProvider: () => Promise<Buffer>
  saltProvider: () => Promise<Buffer>
  contextProvider: (id: string) => Promise<Buffer>
}

export class CryptoKeyStoreFactory {
  private static getValueProviders (keyStoreDescription: KeyStoreDescription) : KeyStoreValueProvider {
    const fStoreConfig = config.get<FileKeyStoreOptions>(keyStoreDescription.configScope)
    const password = Buffer.from(fStoreConfig.password, 'base64')
    const salt = Buffer.from(fStoreConfig.salt, 'base64')
    const context = Buffer.from(fStoreConfig.context, 'base64')
    return {
      passwordProvider: () => Promise.resolve(password),
      saltProvider: () => Promise.resolve(salt),
      contextProvider: () => Promise.resolve(context)
    }
  }

  private static createFileKeyStore (keyStoreDescription: KeyStoreDescription) : IKeyStore {
    const fStoreConfig = config.get<FileKeyStoreOptions>(keyStoreDescription.configScope)
    const valueProviders = this.getValueProviders(keyStoreDescription)
    return new FileKeyStore(fStoreConfig.path, valueProviders.passwordProvider, valueProviders.saltProvider, valueProviders.contextProvider)
  }

  private static createRedisKeyStore (keyStoreDescription: KeyStoreDescription) : IKeyStore {
    const rStoreConfig = config.get<RedisKeyStoreOptions>(keyStoreDescription.configScope)
    const valueProviders = this.getValueProviders(keyStoreDescription)
    return new RedisKeyStore(keyStoreDescription.redisClient || RedisClientFactory.create(keyStoreDescription.configScope), rStoreConfig.keyPrefix, valueProviders.passwordProvider, valueProviders.saltProvider, valueProviders.contextProvider)
  }

  static create (keyStoreDescription: KeyStoreDescription) : IKeyStore {
    switch (keyStoreDescription.type) {
      case KeyStoreType.EMBEDDED:
        return this.createFileKeyStore(keyStoreDescription)
      case KeyStoreType.REDIS:
        return this.createRedisKeyStore(keyStoreDescription)
    }
  }
}
