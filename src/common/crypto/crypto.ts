import { Stream } from 'stream'
import { readFile } from 'fs/promises'
import { randomBytes, createCipheriv, randomUUID, createDecipheriv, createHmac } from 'crypto'
import { CipherText, EncryptOpts, IDataEncryptor, IKeyStore, KeyOpts, SealedKey } from '../interfaces/crypto/dataEncryption'
import { IUsableClosable } from '../using'

/**
 * Implements @see IDataEncryptor interface, consumes IKeyStore for distributed key persistence.
 */
export class Crypto implements IDataEncryptor, IUsableClosable {
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
    const aead = Buffer.from(keyContext || await readFile(this.masterKeyContext))

    const rootKeyDecipher = createDecipheriv('aes-256-gcm', await readFile(this.masterKeyPath), iv, {
      authTagLength: 16
    })
    rootKeyDecipher.setAuthTag(authTag)
    rootKeyDecipher.setAAD(aead)

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
    })
    keyDecipher.setAuthTag(authTag)
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
    const aead = Buffer.from(context || await readFile(this.masterKeyContext))
    cipher.setAAD(aead)
    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()])
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
    const sealedKey = await this.seal(key, await readFile(this.masterKeyPath), context || (await readFile(this.masterKeyContext)).toString('utf-8'))
    await this.saveSealedRootKey(sealedKey)
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
    if (encryptRequest.context) {
      cipher.setAAD(Buffer.from(encryptRequest.context))
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
    return {
      keyId: encryptRequest.keyId,
      rootKeyId: encryptRequest.rootKeyId,
      iv,
      algorithm: 'aes-256-gcm',
      ciphertext: Buffer.concat([cipher.update(encryptRequest.plaintext), cipher.final()]),
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
    return Buffer.concat([decipher.update(decryptOpts.ciphertext as Buffer), decipher.final()])
  }

  async close (): Promise<void> {
    await this.keyStore.close()
  }

  hasDataEncKey (keyId: string): Promise<boolean> {
    return this.keyStore.hasSealedDataEncKey(keyId)
  }

  hasRootKey (rootKeyId: string): Promise<boolean> {
    return this.keyStore.hasSealedRootKey(rootKeyId)
  }

  async mac (keyOpts: KeyOpts, message: Buffer): Promise<Buffer> {
    const dek = await this.unsealDekKey(keyOpts.keyId, keyOpts.rootKeyId, keyOpts.dekContext, keyOpts.rootKeyContext)
    const hmac = createHmac('sha256', dek)
    // drop the cipher text
    hmac.update(message)
    const result = hmac.digest()
    return Promise.resolve(result)
  }

  async validate (opts: KeyOpts, message: Buffer, digest: Buffer): Promise<boolean> {
    // need the dek to validate the ciphertext
    // mac is done with hmac sha256 with the dek as the secret
    return (await this.mac(opts, message)).equals(digest)
  }
}
