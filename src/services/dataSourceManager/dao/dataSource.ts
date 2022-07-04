import COMPUTED_CONSTANTS from '../../../common/computedConstants'
import createLogger from '../../../common/logger/factory'
import { DataSourceDTO } from '../dto/dataSource'
import mongoose, { Connection } from 'mongoose'
import configFactory from '../../../config/mongodbConfig'
import { using } from '../../../common/using'
import { randomBytes } from 'crypto'
import { CryptoRegistrySingleton } from '../../../registries/cryptoRegistry'
import { EncryptOpts } from '../../../common/interfaces/crypto/dataEncryption'

const tableName = 'data_sources'

export enum CredentialType {
  // eslint-disable-next-line no-unused-vars
  BASIC = 'basic',
  // eslint-disable-next-line no-unused-vars
  DIGEST = 'digest',
  // eslint-disable-next-line no-unused-vars
  API_KEY = 'apiKey',
  // eslint-disable-next-line no-unused-vars
  OAUTH2 = 'oauth2',
}
export interface IDataSourceCredentials {
  type: CredentialType
  username: string | undefined
  password: string | undefined
  apiKey: string | undefined
  apiKeyHeader: string | undefined,
  clientId: string | undefined
  clientSecret: string | undefined
  encrypted: boolean
  mac: string
  rootKeyId: string
  keyId: string
}

export interface IDataSource {
    id: string;
    type: string;
    name: string;
    uri: string;
    credentials?: IDataSourceCredentials;
    tags: string[];
}

// TODO: this should be encrypted at rest
const credentialSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  apiKey: {
    type: String,
    required: false
  },
  apiKeyHeader: {
    type: String,
    required: false
  },
  clientId: {
    type: String,
    required: false
  },
  clientSecret: {
    type: String,
    required: false
  },
  encrypted: {
    type: Boolean,
    required: true
  },
  mac: {
    type: String,
    required: true
  }
})

const schema = new mongoose.Schema<IDataSource>({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  uri: {
    type: String,
    required: true
  },
  credentials: {
    type: credentialSchema,
    required: false
  },
  tags: {
    type: [String],
    required: false
  }
})

const config = configFactory.buildConfig('data_source_manager')
export class DataSource implements IDataSource {
  public id: string
  public type: string
  public name: string
  public uri: string
  public tags: string[] = []
  public credentials: IDataSourceCredentials | undefined
  private initialized: boolean = false
  private initPromise: Promise<void> | undefined

  private static readonly log = createLogger({
    serviceName: `data-source-dao-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (dataSource: IDataSource | null = null) {
    if (dataSource == null) {
      this.id = ''
      this.type = ''
      this.name = ''
      this.uri = ''
    } else {
      this.id = dataSource.id
      this.type = dataSource.type
      this.name = dataSource.name
      this.uri = dataSource.uri
      this.credentials = dataSource.credentials
    }
    this.init()
  }

  async init () {
    // if initialized already, return
    if (this.initialized) {
      DataSource.log.debug('DataSource already initialized')
      return
    }
    // if initialization already in progress chain to that promise
    if (this.initPromise) {
      DataSource.log.debug('DataSource Initialization In Progress')
      await this.initPromise
    }
    this.initPromise = this.encryptCredentials().then(() => {
      DataSource.log.debug('Finished encrypting credentials')
      this.initialized = true
    }).catch((err) => {
      DataSource.log.error(`Error occurred while encrypting credentials for data source ${this.id}: ${err.message}`)
      DataSource.log.error(`Initializing data source ${this.id} failed`)
      this.initialized = false
      throw err
    }).finally(() => {
      this.initPromise = undefined
    })
  }

  private async ensureKeysExist (): Promise<void> {
    const crypto = await CryptoRegistrySingleton.getInstance().get('defaultCrypto')
    // if keys are defined for credentials, good, if not generate and set the properties here for usage
    // during encryption
    // also check that if the keys are defined on the credentials that the crypto library still has the keys, otherwise blow up
    if (this.credentials == null) {
      return Promise.resolve()
    }
    if (this.credentials.rootKeyId != null && !await crypto.hasRootKey(this.credentials.rootKeyId)) {
      throw new Error(`Root key ${this.credentials.rootKeyId} is gone! Cannot recover credentials`)
    }
    if (this.credentials.keyId != null && !await crypto.hasDataEncKey(this.credentials.keyId)) {
      throw new Error(`Key ${this.credentials.keyId} is gone! Cannot recover credentials`)
    }
    if (this.credentials.rootKeyId == null && !this.credentials.encrypted) {
      this.credentials.rootKeyId = await crypto.generateRootKey(32, this.getRootKeyContext())
    }
    if (this.credentials.keyId == null && !this.credentials.encrypted) {
      this.credentials.keyId = await crypto.generateDataEncKey(32, this.credentials.rootKeyId, this.getRootKeyContext(), this.getKeyContext())
    }
  }

  private async encryptCredentials (): Promise<void> {
    await this.ensureKeysExist()
    if (this.credentials && !this.credentials.encrypted) {
      this.credentials.encrypted = true
      this.credentials.password = await this.encrypt(this.credentials.password, 'password')
      this.credentials.apiKey = await this.encrypt(this.credentials.apiKey, 'apiKey')
      this.credentials.clientSecret = await this.encrypt(this.credentials.clientSecret, 'clientSecret')
      this.credentials.apiKeyHeader = await this.encrypt(this.credentials.apiKeyHeader, 'apiKeyHeader')
      this.credentials.mac = await this.generateMac()
    } else if (this.credentials && this.credentials.encrypted) {
      const result = await this.validateMac()
      if (!result) {
        throw new Error('MAC validation failed')
      }
    }
  }

  private getMacBuffer () : Buffer {
    if (this.credentials == null) {
      return Buffer.alloc(0)
    }
    return Buffer.concat([
      DataSource.getValAsBuffer(this.credentials.username),
      DataSource.getValAsBuffer(this.credentials.password),
      DataSource.getValAsBuffer(this.credentials.apiKey),
      DataSource.getValAsBuffer(this.credentials.apiKeyHeader),
      DataSource.getValAsBuffer(this.credentials.clientSecret)])
  }

  private async generateMac () : Promise<string> {
    const mac = await (await CryptoRegistrySingleton.getInstance().get('defaultCrypto')).mac({
      rootKeyId: this.getRootKeyId(),
      rootKeyContext: this.getRootKeyContext(),
      keyId: this.getKeyId(),
      dekContext: this.getKeyContext()
    }, this.getMacBuffer())
    return mac.toString('base64')
  }

  private static getValAsBuffer (val: string | undefined): Buffer {
    if (val == null) {
      return Buffer.alloc(0)
    }
    return Buffer.from(val)
  }

  /**
   * Locks unsealing the root key (which is scoped to a data source) except when the URI and ID are still the same,
   * changing the URI will require a complete replacement of keys and the credentials provided to be reencrypted with
   * new keys.
   * @returns context used when sealing the root key
   */
  private getRootKeyContext (): string {
    return `<${this.uri}>-<${this.id}>`
  }

  private getRootKeyId (): string {
    if (!this.credentials?.rootKeyId) {
      throw new Error('Root key id not set')
    }
    return this.credentials?.rootKeyId
  }

  /**
   * Prevents unsealing the data encryption key when the data source has been mutated
   * without updating the credentials. Specifically prevents unsealing the data encryption key
   * when the URI has been changed as to prevent retrieval of credentials via sending to alternate destinations.
   * @returns context to be used when unsealing the data encryption key
   */
  private getKeyContext (): string {
    return `<${this.uri}>-<${this.id}>`
  }

  private getKeyId (): string {
    if (!this.credentials?.keyId) {
      throw new Error('Key id not set')
    }
    return this.credentials?.keyId
  }

  private async validateMac (): Promise<boolean> {
    if (this.credentials == null) {
      return Promise.resolve(false)
    }
    const message = this.getMacBuffer()
    return (await CryptoRegistrySingleton.getInstance().get('defaultCrypto')).validate({
      rootKeyId: this.getRootKeyId(),
      keyId: this.getKeyId(),
      rootKeyContext: this.getRootKeyContext(),
      dekContext: this.getKeyContext()
    }, message, Buffer.from(this.credentials.mac as string, 'base64'))
  }

  private async encrypt (value: string | undefined, propName: string): Promise<string | undefined> {
    if (value == null) {
      return this.encrypt(randomBytes(16).toString('utf-8') + 'N/A' + randomBytes(16).toString('utf-8'), 'dummy')
    }
    const crypto = await CryptoRegistrySingleton.getInstance().get('defaultCrypto')
    const opts: EncryptOpts = {
      plaintext: Buffer.from(value, 'utf-8'),
      rootKeyId: this.getRootKeyId(),
      keyId: this.getKeyId(),
      algorithm: 'aes-256-gcm',
      rootKeyContext: this.getRootKeyContext(),
      dekContext: this.getKeyContext(),
      context: Buffer.from(propName)
    }
    const result = await crypto.encrypt(opts)
    return Buffer.concat([result.iv, result.ciphertext as Buffer, result.authTag || Buffer.alloc(0)]).toString('base64')
  }

  // TODO refactor to be more dry
  private static connect (): Promise<Connection> {
    return new Promise((resolve, reject) => {
      mongoose.createConnection(config.getServerUrl(), config.getMongooseOptions(), (err, conn) => {
        if (err) {
          reject(err)
        } else {
          resolve(conn)
        }
      })
    })
  }

  private static getModel (conn: Connection): mongoose.Model<IDataSource> {
    return conn.model(tableName, schema)
  }

  static async count () : Promise<number> {
    return using<Connection, number>(await this.connect(), async (conn) => {
      return this.getModel(conn).countDocuments()
    })
  }

  static async findById (id: string): Promise<DataSource> {
    return using<Connection, DataSource>(await this.connect(), async (conn) => {
      return new DataSource(await this.getModel(conn).findOne({ id }).exec())
    })
  }

  static async findAll (offset: number, count: number): Promise<Array<DataSource>> {
    if (offset == null || isNaN(offset)) {
      DataSource.log.warn('offset is not defined or NaN, defaulting to 0')
      offset = 0
    }
    if (count == null || isNaN(count)) {
      DataSource.log.warn('count is not defined or NaN, defaulting to 10')
      count = 10
    }
    DataSource.log.debug(`Fetching data sources from offset: ${offset} and count: ${count}`)
    const conn = await this.connect()
    const result = (await this.getModel(conn).find().skip(offset).limit(count).exec()).map(doc => new DataSource(doc))
    await conn.close()
    return result
  }

  static async upsert (dataSource: DataSource): Promise<DataSource> {
    return using<Connection, DataSource>(await this.connect(), async (conn) => {
      const model = this.getModel(conn)
      await dataSource.init()
      await model.updateOne({ id: dataSource.id }, dataSource, { upsert: true }).exec()
      return new DataSource(await model.findOne({
        id: dataSource.id
      }).exec())
    })
  }

  static async has (id: string): Promise<boolean> {
    return using<Connection, boolean>(await this.connect(), async (conn) => {
      return (await this.getModel(conn).findOne({ id }).exec()) !== null
    })
  }

  static async delete (id: string): Promise<void> {
    return using<Connection, void>(await this.connect(), async (conn) => {
      await this.getModel(conn).deleteOne({ id }).exec()
    })
  }

  toDTO (includeCredentials?: boolean): DataSourceDTO {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      uri: this.uri,
      tags: this.tags,
      hasCredentials: this.credentials != null,
      credentials: includeCredentials ? this.credentials : undefined
    }
  }

  static fromDTO (dataSourceDTO: DataSourceDTO): DataSource {
    return new DataSource(dataSourceDTO)
  }
}
