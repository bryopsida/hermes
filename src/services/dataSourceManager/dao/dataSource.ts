import COMPUTED_CONSTANTS from '../../../common/computedConstants'
import createLogger from '../../../common/logger/factory'
import { DataSourceDTO } from '../dto/dataSource'
import mongoose, { Connection } from 'mongoose'
import { randomBytes } from 'crypto'
import { EncryptOpts, IDataEncryptor } from '../../../common/interfaces/crypto/dataEncryption'

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
  type: CredentialType | string
  username?: string
  password?: string
  /**
   * Map of key/value pairs to be used as header values.
   * This would be appropriate for custom header properties such as api key values.
   * When encrypted this is in the form of a base64 encoded string of the ciphertext of the header values JSON.
   */
  headers?: Record<string, string> | string
  encrypted?: boolean
  mac?: string
  rootKeyId?: string
  keyId?: string
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
  keyId: {
    type: String,
    required: true
  },
  rootKeyId: {
    type: String,
    required: true
  },
  headers: {
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
  }

  async init (crypto: IDataEncryptor) : Promise<void> {
    // if initialized already, return
    if (this.initialized === true) {
      DataSource.log.debug('DataSource already initialized')
      return
    }
    // if initialization already in progress chain to that promise
    if (this.initPromise != null) {
      DataSource.log.debug('DataSource Initialization In Progress')
      await this.initPromise
    }
    this.initPromise = this.encryptCredentials(crypto).then(() => {
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
    return this.initPromise
  }

  private async ensureKeysExist (crypto: IDataEncryptor): Promise<void> {
    // if keys are defined for credentials, good, if not generate and set the properties here for usage
    // during encryption
    // also check that if the keys are defined on the credentials that the crypto library still has the keys, otherwise blow up
    if (this.credentials == null) {
      DataSource.log.debug('No credentials defined for data source, skipping key check')
      return Promise.resolve()
    }
    if (this.credentials.rootKeyId != null && !await crypto.hasRootKey(this.credentials.rootKeyId)) {
      throw new Error(`Root key ${this.credentials.rootKeyId} is gone! Cannot recover credentials`)
    }
    if (this.credentials.keyId != null && !await crypto.hasDataEncKey(this.credentials.keyId)) {
      throw new Error(`Key ${this.credentials.keyId} is gone! Cannot recover credentials`)
    }
    if (this.credentials.rootKeyId == null && !this.credentials.encrypted) {
      DataSource.log.debug('Missing root key, generating one')
      this.credentials.rootKeyId = await crypto.generateRootKey(32, this.getRootKeyContext())
    }
    if (this.credentials.keyId == null && !this.credentials.encrypted) {
      DataSource.log.debug('Missing key, generating one')
      this.credentials.keyId = await crypto.generateDataEncKey(32, this.credentials.rootKeyId as string, this.getRootKeyContext(), this.getKeyContext())
    }
  }

  private async encryptCredentials (crypto: IDataEncryptor): Promise<void> {
    await this.ensureKeysExist(crypto)
    if (this.credentials && !this.credentials.encrypted) {
      this.credentials.encrypted = true
      this.credentials.type = await this.encrypt(crypto, this.credentials.type.toString(), 'type') as string
      this.credentials.password = await this.encrypt(crypto, this.credentials.password, 'password')
      this.credentials.username = await this.encrypt(crypto, this.credentials.username, 'username')
      this.credentials.headers = await this.encrypt(crypto, this.credentials.headers != null ? JSON.stringify(this.credentials.headers as string) : undefined, 'headers') as string
      this.credentials.mac = await this.generateMac(crypto)
    } else if (this.credentials && this.credentials.encrypted) {
      const result = await this.validateMac(crypto)
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
      DataSource.getValAsBuffer(this.credentials.type),
      DataSource.getValAsBuffer(this.credentials.username),
      DataSource.getValAsBuffer(this.credentials.password),
      DataSource.getValAsBuffer(this.credentials.headers as string)])
  }

  private async generateMac (crypto: IDataEncryptor) : Promise<string> {
    const mac = await crypto.mac({
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

  private async validateMac (crypto: IDataEncryptor): Promise<boolean> {
    if (this.credentials == null) {
      return Promise.resolve(false)
    }
    const message = this.getMacBuffer()
    return crypto.validate({
      rootKeyId: this.getRootKeyId(),
      keyId: this.getKeyId(),
      rootKeyContext: this.getRootKeyContext(),
      dekContext: this.getKeyContext()
    }, message, Buffer.from(this.credentials.mac as string, 'base64'))
  }

  private async encrypt (crypto: IDataEncryptor, value: string | undefined, propName: string): Promise<string | undefined> {
    if (value == null) {
      return this.encrypt(crypto, randomBytes(16).toString('utf8') + 'N/A' + randomBytes(16).toString('utf8'), 'dummy')
    }
    const opts: EncryptOpts = {
      plaintext: Buffer.from(value, 'utf8'),
      rootKeyId: this.getRootKeyId(),
      keyId: this.getKeyId(),
      algorithm: 'aes-256-gcm',
      rootKeyContext: this.getRootKeyContext(),
      dekContext: this.getKeyContext(),
      context: Buffer.from(propName)
    }
    return crypto.encryptAndEncode(opts)
  }

  private static getModel (conn: Connection): mongoose.Model<IDataSource> {
    return conn.model(tableName, schema)
  }

  static async count (conn: Connection) : Promise<number> {
    return this.getModel(conn).countDocuments()
  }

  static async findById (conn: Connection, id: string): Promise<DataSource> {
    DataSource.log.debug(`Finding data source with id ${id}`)
    return new DataSource(await this.getModel(conn).findOne({ id }).exec())
  }

  static async findAll (conn: Connection, offset: number, count: number): Promise<Array<DataSource>> {
    if (offset == null || isNaN(offset)) {
      DataSource.log.warn('offset is not defined or NaN, defaulting to 0')
      offset = 0
    }
    if (count == null || isNaN(count)) {
      DataSource.log.warn('count is not defined or NaN, defaulting to 10')
      count = 10
    }
    DataSource.log.debug(`Fetching data sources from offset: ${offset} and count: ${count}`)
    return (await this.getModel(conn).find().skip(offset).limit(count).exec()).map(doc => new DataSource(doc))
  }

  static async upsert (conn: Connection, crypto: IDataEncryptor, dataSource: DataSource): Promise<DataSource> {
    DataSource.log.debug(`Upserting data source ${dataSource.id}`)
    const model = this.getModel(conn)
    DataSource.log.debug('Initializing data source for upsert')
    await dataSource.init(crypto)
    DataSource.log.debug('Finished initializing data source for upsert')
    await model.updateOne({ id: dataSource.id }, dataSource, { upsert: true }).exec()
    return new DataSource(await model.findOne({
      id: dataSource.id
    }).exec())
  }

  static async has (conn: Connection, id: string): Promise<boolean> {
    return (await this.getModel(conn).findOne({ id }).exec()) !== null
  }

  static async delete (conn: Connection, id: string): Promise<void> {
    await this.getModel(conn).deleteOne({ id }).exec()
  }

  toDTO (includeCredentials?: boolean): DataSourceDTO {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      uri: this.uri,
      tags: this.tags,
      hasCredentials: this.credentials != null,
      credentials: includeCredentials ? DataSource.toCredentialDTO(this.credentials as IDataSourceCredentials) : undefined
    }
  }

  private static toCredentialDTO (credentials: IDataSourceCredentials): IDataSourceCredentials {
    return {
      rootKeyId: credentials.rootKeyId,
      keyId: credentials.keyId,
      mac: credentials.mac,
      headers: credentials.headers,
      encrypted: credentials.encrypted,
      password: credentials.password,
      username: credentials.username,
      type: credentials.type as CredentialType
    }
  }

  static fromDTO (dataSourceDTO: DataSourceDTO): DataSource {
    return new DataSource(dataSourceDTO)
  }
}
