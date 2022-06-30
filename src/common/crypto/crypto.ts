import { Stream } from 'stream'
import { readFile } from 'fs/promises'
import { randomBytes, createCipheriv, randomUUID } from 'crypto'
import { CipherText, EncryptOpts, IDataEncryptor, IKeyStore } from '../interfaces/crypto/dataEncryption'

export interface SealedKey {
  keyId: string;
  rootKeyId?: string;
  iv: Buffer;
  authTags: Buffer;
  keyCipherText: Buffer;
}

/**
 * Implements @see IDataEncryptor interface, consumes IKeyStore for distributed key persistence.
 */
export class Crypto implements IDataEncryptor {
  private readonly masterKeyPath: string
  private readonly masterKeyContext: string
  private readonly keyStore: IKeyStore

  constructor (keyStore: IKeyStore, masterKeyPath: string, masterKeyContext: string) {
    this.masterKeyPath = masterKeyPath
    this.masterKeyContext = masterKeyContext
    this.keyStore = keyStore
  }

  private async seal (data: Buffer, key: Buffer, context: Buffer) : Promise<SealedKey> {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16
    })
    cipher.setAAD(context)
    let ciphertext = cipher.update(data)
    ciphertext = Buffer.concat([ciphertext, cipher.final()])
    const authTags = cipher.getAuthTag()
    return {
      keyId: randomUUID(),
      rootKeyId: 'master',
      keyCipherText: ciphertext,
      iv,
      authTags
    }
  }

  private async saveSealedKey (sealedKey: SealedKey): Promise<void> {

  }

  async generateRootKey (size: number): Promise<string> {
    // use a strong random number generator to generate a key at the desired size.
    const key: Buffer = randomBytes(size)
    const sealedKey = await this.seal(key, await readFile(this.masterKeyPath))
    await this.saveSealedKey(sealedKey)
    return sealedKey.keyId
  }

  generateDataEncKey (size: number, rootKeyId: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  destroyDataEncKey (keyId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  destroyRootKey (rootKeyId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  encrypt (encryptRequest: EncryptOpts): Promise<CipherText> {
    throw new Error('Method not implemented.')
  }

  decrypt (decryptOpts: CipherText): Promise<string | Buffer | Stream> {
    throw new Error('Method not implemented.')
  }
}
