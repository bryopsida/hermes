import { randomBytes } from 'crypto'

/* eslint-disable no-undef */
describe('MongoKeyStore', () => {
  // launch mongodb in test container
  it('can manage a DEK', async () => {
    // create a keystore

    // create random data to act as key store
    const key = randomBytes(32)

    // save it

    // ask for it back

    // should be the same

    // delete it

    // shouldn't be able to fetch it

    // shouldn't exist on disk
    expect(true).toBe(false)
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
