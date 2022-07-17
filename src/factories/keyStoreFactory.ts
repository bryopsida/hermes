import { FileKeyStore } from '../common/crypto/fileKeyStore'
import { IKeyStore } from '../common/interfaces/crypto/dataEncryption'
import config from 'config'
import { RedisKeyStore } from '../common/crypto/redisKeyStore'
import { Cluster, Redis } from 'ioredis'
import { RedisClientFactory } from './redisClientFactory'
import { readFile } from 'fs/promises'
import { resolveHome } from '../common/fs/resolve'

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
  passwordPath: string
  saltPath: string
  contextPath: string
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
    return {
      passwordProvider: async () => {
        return Buffer.from(await readFile(resolveHome(fStoreConfig.passwordPath), 'base64'))
      },
      saltProvider: async () => {
        return Buffer.from(await readFile(resolveHome(fStoreConfig.saltPath), 'base64'))
      },
      contextProvider: async () => {
        return Buffer.from(await readFile(resolveHome(fStoreConfig.contextPath), 'base64'))
      }
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
