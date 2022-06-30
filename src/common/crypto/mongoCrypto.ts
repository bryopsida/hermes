import { ConnectOptions} from 'mongoose'
import { Stream } from 'stream'
import { CipherText, EncryptOpts, IDataEncryptor } from '../interfaces/crypto/dataEncryption'

/**
 * Implements @see IDataEncryptor interface using mongodb as the distributed store for data encryption keys.
 * root keys are also stored in mongodb but sealed with a key that's only available at the application layer.
 */
export class MongoCrypto implements IDataEncryptor {
  private readonly mongooseOptions: ConnectOptions
  private readonly masterKeyPath: string

  constructor (mongooseOptions: ConnectOptions, masterKeyPath: string) {
    this.mongooseOptions = mongooseOptions
    this.masterKeyPath = masterKeyPath
  }

  generateRootKey (size: number): Promise<string> {
    throw new Error('Method not implemented.')
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
