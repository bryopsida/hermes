import { Stream } from 'stream'
import { readFile } from 'fs/promises'
import { randomBytes, createCipheriv, randomUUID, createDecipheriv } from 'crypto'
import { CipherText, EncryptOpts, IDataEncryptor, IKeyStore, SealedKey } from '../interfaces/crypto/dataEncryption'

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

  private async unsealRootKey (keyId: string, keyContext: string|undefined): Promise<Buffer> {
    const sealedKey = await this.keyStore.fetchSealedRootKey(keyId)
    const iv = sealedKey.slice(0, 16)
    const authTag = sealedKey.slice(sealedKey.length - 16)
    const encryptedKey = sealedKey.slice(16, sealedKey.length - 16)

    const rootKeyDecipher = createDecipheriv('aes-256-gcm', await readFile(this.masterKeyPath), iv, {
      authTagLength: 16
    })
    rootKeyDecipher.setAuthTag(authTag)
    rootKeyDecipher.setAAD(Buffer.from(keyContext || await readFile(this.masterKeyContext)))

    const key = rootKeyDecipher.update(encryptedKey)
    return Buffer.concat([key, rootKeyDecipher.final()])
  }

  private async unsealDekKey (keyId: string, rootKeyId: string, keyContext: string|undefined, rootKeyContext: string|undefined): Promise<Buffer> {
    const rootKey = await this.unsealRootKey(rootKeyId, rootKeyContext)
    const sealedKey = await this.keyStore.fetchSealedDataEncKey(keyId)
    const iv = sealedKey.slice(0, 16)
    const authTag = sealedKey.slice(sealedKey.length - 16)
    const encryptedKey = sealedKey.slice(16, sealedKey.length - 16)
    const keyDecipher = createDecipheriv('aes-256-gcm', rootKey, iv, {
      authTagLength: 16
    }).setAuthTag(authTag)
    if (keyContext) {
      keyDecipher.setAAD(Buffer.from(keyContext))
    }
    const key = keyDecipher.update(encryptedKey)
    return Buffer.concat([key, keyDecipher.final()])
  }

  private async seal (data: Buffer, key: Buffer, context: string|undefined) : Promise<SealedKey> {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', key, iv, {
      authTagLength: 16
    })
    if (context) {
      cipher.setAAD(Buffer.from(context))
    }
    let ciphertext = cipher.update(data)
    ciphertext = Buffer.concat([ciphertext, cipher.final()])
    const authTag = cipher.getAuthTag()
    return {
      keyId: randomUUID(),
      rootKeyId: 'master',
      keyCipherText: ciphertext,
      iv,
      authTag
    }
  }

  private async saveSealedKey (sealedKey: SealedKey): Promise<void> {
    await this.keyStore.saveSealedDataEncKey(sealedKey.keyId, Buffer.concat([sealedKey.iv, sealedKey.keyCipherText, sealedKey.authTag || Buffer.alloc(0)]))
  }

  private async saveSealedRootKey (sealedKey: SealedKey): Promise<void> {
    await this.keyStore.saveSealedRootKey(sealedKey.keyId, Buffer.concat([sealedKey.iv, sealedKey.keyCipherText, sealedKey.authTag || Buffer.alloc(0)]))
  }

  async generateRootKey (size: number, context: string|undefined): Promise<string> {
    // use a strong random number generator to generate a key at the desired size.
    const key: Buffer = randomBytes(size)
    const sealedKey = await this.seal(key, await readFile(this.masterKeyPath), (await readFile(this.masterKeyContext)).toString('utf-8'))
    await this.saveSealedKey(sealedKey)
    return sealedKey.keyId
  }

  async generateDataEncKey (size: number, rootKeyId: string, rootKeyContext: string|undefined, dekContext: string|undefined): Promise<string> {
    const key: Buffer = randomBytes(size)
    const rootKey = await this.unsealRootKey(rootKeyId, rootKeyContext)
    const sealedKey = await this.seal(key, rootKey, dekContext)
    await this.saveSealedKey(sealedKey)
    return sealedKey.keyId
  }

  async destroyDataEncKey (keyId: string): Promise<void> {
    await this.keyStore.destroySealedDataEncKey(keyId)
  }

  async destroyRootKey (rootKeyId: string): Promise<void> {
    await this.keyStore.destroySealedRootKey(rootKeyId)
  }

  async encrypt (encryptRequest: EncryptOpts): Promise<CipherText> {
    const dek = await this.unsealDekKey(encryptRequest.keyId, encryptRequest.rootKeyId, encryptRequest.dekContext, encryptRequest.rootKeyContext)
    const iv = encryptRequest.iv || randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', dek, iv, {
      authTagLength: 16
    })
    if (encryptRequest.dekContext) {
      cipher.setAAD(Buffer.from(encryptRequest.dekContext))
    }
    if (encryptRequest.plaintext instanceof Stream) {
      const retText: CipherText = {
        keyId: encryptRequest.keyId,
        rootKeyId: encryptRequest.rootKeyId,
        iv,
        algorithm: 'aes-256-gcm',
        ciphertext: encryptRequest.plaintext.pipe(cipher).on('finish', () => {
          retText.authTag = cipher.getAuthTag()
        })
      }
      return retText
    }
    const ciphertext = cipher.update(encryptRequest.plaintext)
    return {
      keyId: encryptRequest.keyId,
      rootKeyId: encryptRequest.rootKeyId,
      iv,
      algorithm: 'aes-256-gcm',
      ciphertext: Buffer.concat([ciphertext, cipher.final()]),
      authTag: cipher.getAuthTag()
    }
  }

  async decrypt (decryptOpts: CipherText): Promise<string | Buffer | Stream> {
    const dek = await this.unsealDekKey(decryptOpts.keyId, decryptOpts.rootKeyId, decryptOpts.dekContext, decryptOpts.rootKeyContext)
    const decipher = createDecipheriv('aes-256-gcm', dek, decryptOpts.iv, {
      authTagLength: 16
    })
    if (decryptOpts.authTag) {
      decipher.setAuthTag(decryptOpts.authTag)
    }
    if (decryptOpts.context) {
      decipher.setAAD(Buffer.from(decryptOpts.context))
    }
    if (decryptOpts.ciphertext instanceof Stream) {
      return decryptOpts.ciphertext.pipe(decipher)
    }
    const plaintext = decipher.update(decryptOpts.ciphertext as Buffer)
    return Buffer.concat([plaintext, decipher.final()])
  }
}
