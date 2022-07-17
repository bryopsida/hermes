import { writeFile, mkdir, access, readFile, unlink, rm } from 'fs/promises'
import { resolveHome } from '../fs/resolve'
import { BaseKeyStore, IKeyStoreContextProvider, IKeyStoreValueProvider } from './baseKeyStore'

/**
 * Persists keys into the file system, needs a path to the file and a password.
 * The password is used to generate a key using scrypt. The store is encrypted
 * with aes-256-gcm. Uses AEAD, grabs the mac address of the first external
 * interface and uses it as the context.
 */
export class FileKeyStore extends BaseKeyStore {
  private readonly keyStorePath: string

  constructor (keyStorePath: string, keyStorePasswordProvider: IKeyStoreValueProvider, keyStoreSaltProvider: IKeyStoreValueProvider, keyStoreContextProvider: IKeyStoreContextProvider) {
    super(keyStorePasswordProvider, keyStoreSaltProvider, keyStoreContextProvider)
    this.keyStorePath = resolveHome(keyStorePath)
  }

  protected hasKeyInSlot (keySlot: string): Promise<boolean> {
    return access(this.keyStorePath + '/' + keySlot).then(() => true).catch(() => false)
  }

  private async createKeyStoreDirIfNotExists (): Promise<void> {
    await access(this.keyStorePath).catch(async () => {
      await mkdir(this.keyStorePath, { recursive: true })
    })
  }

  protected async putKeyInSlot (keySlot: string, key: Buffer): Promise<void> {
    await this.createKeyStoreDirIfNotExists()
    await writeFile(this.keyStorePath + '/' + keySlot, key)
  }

  protected async getKeyInSlot (keySlot: string): Promise<Buffer> {
    return readFile(this.keyStorePath + '/' + keySlot)
  }

  protected async deleteKeySlot (keySlot: string): Promise<void> {
    await unlink(this.keyStorePath + '/' + keySlot)
  }

  protected async clearKeySlots (): Promise<void> {
    await rm(this.keyStorePath, { recursive: true, force: true, maxRetries: 3 })
  }

  async close (): Promise<void> {
    // nothing to do
  }
}
