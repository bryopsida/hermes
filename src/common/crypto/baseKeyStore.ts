import { BinaryLike, createCipheriv, createDecipheriv, createHash, randomBytes, scrypt } from 'crypto'
import { IKeyStore } from '../interfaces/crypto/dataEncryption'

export interface IKeyStoreValueProvider {
  (): Promise<Buffer>
}

export interface IKeyStoreContextProvider {
  (id: string): Promise<Buffer>
}

export abstract class BaseKeyStore implements IKeyStore {
  protected readonly keyStorePasswordProvider: IKeyStoreValueProvider
  protected readonly keyStoreSaltProvider: IKeyStoreValueProvider
  protected readonly keyStoreContextProvider: IKeyStoreContextProvider

  constructor (keyStorePasswordProvider: IKeyStoreValueProvider, keyStoreSaltProvider: IKeyStoreValueProvider, keyStoreContextProvider: IKeyStoreContextProvider) {
    this.keyStorePasswordProvider = keyStorePasswordProvider
    this.keyStoreSaltProvider = keyStoreSaltProvider
    this.keyStoreContextProvider = keyStoreContextProvider
  }

  async hasSealedRootKey (rootKeyId: string): Promise<boolean> {
    const keySlot = await this.getKeySlot('dek', rootKeyId, await this.keyStoreSaltProvider())
    return this.hasKeyInSlot(keySlot)
  }

  async saveSealedRootKey (rootKeyId: string, key: Buffer): Promise<void> {
    await this.saveSealedKey('root', rootKeyId, key)
  }

  async saveSealedDataEncKey (keyId: string, key: Buffer): Promise<void> {
    await this.saveSealedKey('dek', keyId, key)
  }

  async hasSealedDataEncKey (keyId: string): Promise<boolean> {
    const keySlot = await this.getKeySlot('dek', keyId, await this.keyStoreSaltProvider())
    return this.hasKeyInSlot(keySlot)
  }

  fetchSealedRootKey (rootKeyId: string): Promise<Buffer> {
    return this.fetchSealedKey('root', rootKeyId)
  }

  fetchSealedDataEncKey (keyId: string): Promise<Buffer> {
    return this.fetchSealedKey('dek', keyId)
  }

  async destroySealedRootKey (rootKeyId: string): Promise<void> {
    await this.deleteSealedKey('root', rootKeyId)
  }

  async destroySealedDataEncKey (keyId: string): Promise<void> {
    await this.deleteSealedKey('dek', keyId)
  }

  async destroyAllKeys (): Promise<void> {
    await this.clearKeySlots()
  }

  protected async getScryptKey (password: BinaryLike, salt: BinaryLike, context: Buffer) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, 32, (err, key) => {
        if (err) {
          return reject(err)
        }
        return resolve(key)
      })
    })
  }

  protected async getKeySlot (type: string, keyId: string, salt: Buffer): Promise<string> {
    const hash = createHash('sha256')
    hash.update(type)
    hash.update(keyId)
    hash.update(salt)
    return hash.digest('hex')
  }

  protected async saveSealedKey (type: string, keyId: string, key: Buffer): Promise<void> {
    // first lets get the file name which is sha256(key id + salt)
    const salt = await this.keyStoreSaltProvider()
    const keySlot = await this.getKeySlot(type, keyId, salt)
    const context = await this.keyStoreContextProvider(keyId)
    const password = await this.keyStorePasswordProvider()
    const scryptKey = await this.getScryptKey(password, salt, context)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', scryptKey, iv, {
      authTagLength: 16
    }).setAAD(context)
    const ciphertext = Buffer.concat([iv, cipher.update(key), cipher.final(), cipher.getAuthTag()])
    await this.putKeyInSlot(keySlot, ciphertext)
  }

  protected async fetchSealedKey (type: string, keyId: string): Promise<Buffer> {
    const salt = await this.keyStoreSaltProvider()
    const keySlot = await this.getKeySlot(type, keyId, salt)
    if (!await this.hasKeyInSlot(keySlot)) {
      throw new Error('Key not found')
    }
    const key = await this.getKeyInSlot(keySlot)
    const context = await this.keyStoreContextProvider(keyId)
    const password = await this.keyStorePasswordProvider()
    const scryptKey = await this.getScryptKey(password, salt, context)
    const iv = key.slice(0, 16)
    const authTag = key.slice(key.length - 16)
    const keyCipherText = key.slice(16, key.length - 16)
    const decipher = createDecipheriv('aes-256-gcm', scryptKey, iv, {
      authTagLength: 16
    }).setAAD(context)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(keyCipherText), decipher.final()])
  }

  protected async deleteSealedKey (type: string, keyId: string): Promise<void> {
    const salt = await this.keyStoreSaltProvider()
    const keySlot = await this.getKeySlot(type, keyId, salt)
    await this.deleteKeySlot(keySlot)
  }

  protected abstract putKeyInSlot (keySlot: string, key: Buffer): Promise<void>
  protected abstract getKeyInSlot (keySlot: string): Promise<Buffer>
  protected abstract hasKeyInSlot (keySlot: string): Promise<boolean>
  protected abstract deleteKeySlot (keySlot: string): Promise<void>
  protected abstract clearKeySlots (): Promise<void>
  public abstract close (): Promise<void>
}
