import COMPUTED_CONSTANTS from '../../../common/computedConstants'
import createLogger from '../../../common/logger/factory'
import { DataSourceDTO } from '../dto/dataSource'
import mongoose, { Connection } from 'mongoose'
import configFactory from '../../../config/mongodbConfig'
import { using } from '../../../common/using'

const tableName = 'data_sources'

export enum CredentialType {
  BASIC = 'basic',
  DIGEST = 'digest',
  API_KEY = 'apiKey',
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
