import { IKeyStore } from '../interfaces/crypto/dataEncryption'
import { scrypt, createHash, randomBytes, createCipheriv } from 'crypto'
import { writeFile } from 'fs/promises'

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

  async saveSealedRootKey (rootKeyId: string, key: Buffer): Promise<void> {
    // first lets get the file name which is sha256(key id + salt)
    const hash = createHash('sha256')
    hash.update('root')
    hash.update(rootKeyId)
    const salt = await this.keyStoreSaltProvider()
    hash.update(salt)

    const fileName = hash.digest('hex')
    const context = await this.keyStoreContextProvider(rootKeyId)
    return new Promise((resolve, reject) => {
      return this.keyStorePasswordProvider().then(password => {
        scrypt(password, salt, 32, (err, key) => {
          if (err) {
            return reject(err)
          }
          const iv = randomBytes(16)
          const cipher = createCipheriv('aes-256-gcm', key, iv, {
            authTagLength: 16
          }).setAAD(Buffer.from(context))
          const ciphertext = Buffer.concat([iv, cipher.update(key), cipher.final(), cipher.getAuthTag()])
          return writeFile(this.keyStorePath + '/' + fileName, ciphertext).then(resolve)
        })
      }).catch(reject)
    })
  }

  saveSealedDataEncKey (keyId: string, key: Buffer): Promise<void> {
    throw new Error('Method not implemented.')
  }

  fetchSealedRootKey (rootKeyId: string): Promise<Buffer> {
    throw new Error('Method not implemented.')
  }

  fetchSealedDataEncKey (keyId: string): Promise<Buffer> {
    throw new Error('Method not implemented.')
  }

  destroySealedRootKey (rootKeyId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  destroySealedDataEncKey (keyId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  destroyAllKeys (): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
