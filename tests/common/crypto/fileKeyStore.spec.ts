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
    expect(true).toBe(false)
  })
  it('can shred all the keys', async () => {
    expect(true).toBe(false)
  })
  it('fails when host seed changes', async () => {
    expect(true).toBe(false)
  })
  it('fails when host key changes', async () => {
    expect(true).toBe(false)
  })
})
