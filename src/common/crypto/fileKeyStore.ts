import { IKeyStore } from '../interfaces/crypto/dataEncryption'
import { scrypt, createHash, randomBytes, createCipheriv, createDecipheriv, BinaryLike } from 'crypto'
import { writeFile, mkdir, access, readFile, unlink, rmdir } from 'fs/promises'

export interface IKeyStoreValueProvider {
  (): Promise<Buffer>
}

export interface IKeyStoreContextProvider {
  (id: string): Promise<Buffer>
}

/**
 * Persists keys into the file system, needs a path to the file and a password.
 * The password is used to generate a key using scrypt. The store is encrypted
 * with aes-256-gcm. Uses AEAD, grabs the mac address of the first external
 * interface and uses it as the context.
 */
export class FileKeyStore implements IKeyStore {
  private readonly keyStorePath: string
  private readonly keyStorePasswordProvider: IKeyStoreValueProvider
  private readonly keyStoreSaltProvider: IKeyStoreValueProvider
  private readonly keyStoreContextProvider: IKeyStoreContextProvider

  constructor (keyStorePath: string, keyStorePasswordProvider: IKeyStoreValueProvider, keyStoreSaltProvider: IKeyStoreValueProvider, keyStoreContextProvider: IKeyStoreContextProvider) {
    this.keyStorePath = keyStorePath
    this.keyStorePasswordProvider = keyStorePasswordProvider
    this.keyStoreSaltProvider = keyStoreSaltProvider
    this.keyStoreContextProvider = keyStoreContextProvider
  }

  private async createKeyStoreDirIfNotExists (): Promise<void> {
    await access(this.keyStorePath).catch(async () => {
      await mkdir(this.keyStorePath, { recursive: true })
    })
  }

  private async getFileName (type: string, keyId: string, salt: Buffer): Promise<string> {
    const hash = createHash('sha256')
    hash.update(type)
    hash.update(keyId)
    hash.update(salt)
    return hash.digest('hex')
  }

  private async getScryptKey (password: BinaryLike, salt: BinaryLike, context: Buffer) : Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, 32, (err, key) => {
        if (err) {
          return reject(err)
        }
        return resolve(key)
      })
    })
  }

  private async saveSealedKey (type: string, keyId: string, key: Buffer): Promise<void> {
    // first lets get the file name which is sha256(key id + salt)
    const salt = await this.keyStoreSaltProvider()
    const fileName = await this.getFileName(type, keyId, salt)
    const context = await this.keyStoreContextProvider(keyId)
    const password = await this.keyStorePasswordProvider()
    const scryptKey = await this.getScryptKey(password, salt, context)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', scryptKey, iv, {
      authTagLength: 16
    }).setAAD(context)
    const ciphertext = Buffer.concat([iv, cipher.update(key), cipher.final(), cipher.getAuthTag()])
    await this.createKeyStoreDirIfNotExists()
    await writeFile(this.keyStorePath + '/' + fileName, ciphertext)
  }

  private async fetchSealedKey (type: string, keyId: string): Promise<Buffer> {
    const salt = await this.keyStoreSaltProvider()
    const fileName = await this.getFileName(type, keyId, salt)
    const key = await readFile(this.keyStorePath + '/' + fileName)
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

  private async destroyKey (type: string, keyId: string): Promise<void> {
    const salt = await this.keyStoreSaltProvider()
    const fileName = await this.getFileName(type, keyId, salt)
    await unlink(this.keyStorePath + '/' + fileName)
  }

  async saveSealedRootKey (rootKeyId: string, key: Buffer): Promise<void> {
    await this.saveSealedKey('root', rootKeyId, key)
  }

  async saveSealedDataEncKey (keyId: string, key: Buffer): Promise<void> {
    await this.saveSealedKey('dek', keyId, key)
  }

  fetchSealedRootKey (rootKeyId: string): Promise<Buffer> {
    return this.fetchSealedKey('root', rootKeyId)
  }

  fetchSealedDataEncKey (keyId: string): Promise<Buffer> {
    return this.fetchSealedKey('dek', keyId)
  }

  destroySealedRootKey (rootKeyId: string): Promise<void> {
    return this.destroyKey('root', rootKeyId)
  }

  destroySealedDataEncKey (keyId: string): Promise<void> {
    return this.destroyKey('dek', keyId)
  }

  destroyAllKeys (): Promise<void> {
    return rmdir(this.keyStorePath)
  }
}
