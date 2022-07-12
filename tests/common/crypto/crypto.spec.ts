import { randomBytes, randomUUID } from 'crypto'
import { tmpdir } from 'os'
import { FileKeyStore } from '../../../src/common/crypto/fileKeyStore'
import { IDataEncryptor, IKeyStore, EncryptOpts } from '../../../src/common/interfaces/crypto/dataEncryption'
import { Crypto } from '../../../src/common/crypto/crypto'
import { writeFile } from 'fs/promises'
/* eslint-disable no-undef */
describe('Crypto', () => {
  let keyStore: IKeyStore
  let crypto: IDataEncryptor

  beforeEach(async () => {
    const key = randomBytes(32)
    const salt = randomBytes(16)
    const context = randomBytes(32)
    const masterKey = randomBytes(32).toString('base64')
    const masterSalt = randomBytes(16).toString('base64')
    const masterKeyFile = randomUUID()
    const masterSaltFile = randomUUID()
    const storeDir = tmpdir()
    const keyStoreDir = randomUUID()
    await writeFile(`${storeDir}/${masterKeyFile}`, masterKey)
    await writeFile(`${storeDir}/${masterSaltFile}`, masterSalt)
    keyStore = new FileKeyStore(`${storeDir}/${keyStoreDir}`, () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))
    crypto = new Crypto(keyStore, `${storeDir}/${masterKeyFile}`, `${storeDir}/${masterSaltFile}`)
  })
  it('can generate a DEK', async () => {
    const rootKeyId = await crypto.generateRootKey(32, 'gen-dek-test')
    const dek = await crypto.generateDataEncKey(32, rootKeyId, 'gen-dek-test', 'dek')
    expect(dek).toBeDefined()
  })
  it('can generate a root key', async () => {
    const rootKeyId = await crypto.generateRootKey(32, 'gen-rk-test')
    expect(rootKeyId).toBeDefined()
  })
  it('can encrypt and decrypt a buffer', async () => {
    const rootKeyId = await crypto.generateRootKey(32, 'buffer-test')
    const dek = await crypto.generateDataEncKey(32, rootKeyId, 'buffer-test', 'dek')
    expect(dek).toBeDefined()
    const data = randomBytes(32)
    const encryptRequest: EncryptOpts = {
      plaintext: data,
      keyId: dek,
      rootKeyId: rootKeyId,
      rootKeyContext: 'buffer-test',
      dekContext: 'dek',
      context: Buffer.from('buffer-test')
    }
    const encrypted = await crypto.encrypt(encryptRequest)
    encrypted.rootKeyContext = 'buffer-test'
    encrypted.dekContext = 'dek'
    encrypted.context = 'buffer-test'
    const plainText = await crypto.decrypt(encrypted)
    expect(plainText).toEqual(data)
  })
  it('can encrypt and decrypted encoded text', async () => {
    const rootKeyId = await crypto.generateRootKey(32, 'encoded-test')
    const dek = await crypto.generateDataEncKey(32, rootKeyId, 'encoded-test', 'dek')
    const encryptedData = await crypto.encryptAndEncode({
      plaintext: Buffer.from('test-data'),
      keyId: dek,
      rootKeyId,
      rootKeyContext: 'encoded-test',
      dekContext: 'dek',
      context: Buffer.from('data-context')
    })
    const plainText = (await crypto.decryptEncoded(encryptedData, 'encoded-test', 'dek', 'data-context')).toString('utf8')
    expect(plainText).toEqual('test-data')
  })
})
