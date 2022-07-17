import { randomBytes, randomUUID } from 'crypto'
import { FileKeyStore } from '../../../src/common/crypto/fileKeyStore'
import { tmpdir } from 'os'

/* eslint-disable no-undef */
describe('FileKeyStore', () => {
  it('can manage a DEK', async () => {
    const storeDir = tmpdir()
    const key = randomBytes(32)
    const salt = randomBytes(16)
    const context = randomBytes(32)

    // create a keystore
    const keystore = new FileKeyStore(storeDir + '/keystore', () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))

    // create random data to act as key store
    const dek = randomBytes(32)
    const id = randomUUID()

    // save it
    await keystore.saveSealedDataEncKey(id, dek)

    // ask for it back
    const fetchedDek = await keystore.fetchSealedDataEncKey(id)

    // should be the same
    expect(fetchedDek).toEqual(dek)

    // delete it
    await keystore.destroySealedDataEncKey(id)

    // shouldn't be able to fetch it
    await expect(keystore.fetchSealedDataEncKey(id)).rejects.toThrow()
  })
  it('can manage a root key', async () => {
    const storeDir = tmpdir()
    const key = randomBytes(32)
    const salt = randomBytes(16)
    const context = randomBytes(32)

    // create a keystore
    const keystore = new FileKeyStore(storeDir + '/keystore', () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))

    // create random data to act as key store
    const rootKey = randomBytes(32)
    const id = randomUUID()

    // save it
    await keystore.saveSealedRootKey(id, rootKey)

    // ask for it back
    const fetched = await keystore.fetchSealedRootKey(id)

    // should be the same
    expect(fetched).toEqual(rootKey)

    // delete it
    await keystore.destroySealedRootKey(id)

    // shouldn't be able to fetch it
    await expect(keystore.fetchSealedRootKey(id)).rejects.toThrow()
  })
  it('can shred all the keys', async () => {
    const storeDir = tmpdir()
    const key = randomBytes(32)
    const salt = randomBytes(16)
    const context = randomBytes(32)

    // create a keystore
    const keystore = new FileKeyStore(storeDir + '/keystore-shred', () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))

    // create random data to act as key store
    const rootKey = randomBytes(32)
    const rootKeyId = randomUUID()

    const dek = randomBytes(32)
    const dekId = randomUUID()
    await keystore.saveSealedRootKey(rootKeyId, rootKey)
    await keystore.saveSealedDataEncKey(dekId, dek)

    // delete all the keys
    await keystore.destroyAllKeys()

    // shouldn't be able to fetch it
    await expect(keystore.fetchSealedRootKey(rootKeyId)).rejects.toThrow()
    await expect(keystore.fetchSealedDataEncKey(dekId)).rejects.toThrow()
  })
  it('fails when salt changes', async () => {
    const storeDir = tmpdir()
    const key = randomBytes(32)
    let salt = randomBytes(16)
    const context = randomBytes(32)

    // create a keystore
    const keystore = new FileKeyStore(storeDir + '/keystore', () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))

    // create key
    const dek = randomBytes(32)
    const dekId = randomUUID()
    await keystore.saveSealedDataEncKey(dekId, dek)

    // we can fetch it
    const fetched = await keystore.fetchSealedDataEncKey(dekId)
    expect(fetched).toEqual(dek)

    // now we change the salt
    salt = randomBytes(16)
    // should fail
    await expect(keystore.fetchSealedDataEncKey(dekId)).rejects.toThrow()
  })
  it('fails when context changes', async () => {
    const storeDir = tmpdir()
    const key = randomBytes(32)
    const salt = randomBytes(16)
    let context = randomBytes(32)

    // create a keystore
    const keystore = new FileKeyStore(storeDir + '/keystore', () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))
    // create key
    const dek = randomBytes(32)
    const dekId = randomUUID()
    await keystore.saveSealedDataEncKey(dekId, dek)

    // we can fetch it
    const fetched = await keystore.fetchSealedDataEncKey(dekId)
    expect(fetched).toEqual(dek)

    // break it
    context = randomBytes(32)
    // should fail
    await expect(keystore.fetchSealedDataEncKey(dekId)).rejects.toThrow()
  })
  it('fails when password changes', async () => {
    const storeDir = tmpdir()
    let key = randomBytes(32)
    const salt = randomBytes(16)
    const context = randomBytes(32)

    // create a keystore
    const keystore = new FileKeyStore(storeDir + '/keystore', () => Promise.resolve(key), () => Promise.resolve(salt), () => Promise.resolve(context))
    // create key
    const dek = randomBytes(32)
    const dekId = randomUUID()
    await keystore.saveSealedDataEncKey(dekId, dek)

    // we can fetch it
    const fetched = await keystore.fetchSealedDataEncKey(dekId)
    expect(fetched).toEqual(dek)

    // break it
    key = randomBytes(32)
    // should fail
    await expect(keystore.fetchSealedDataEncKey(dekId)).rejects.toThrow()
  })
})
