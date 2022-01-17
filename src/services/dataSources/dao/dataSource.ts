import COMPUTED_CONSTANTS from '../../../common/computedConstants'
import createLogger from '../../../common/logger/factory'
import { DataSourceDTO } from '../dto/dataSource'
import mongoose from 'mongoose'
import configFactory from '../../../config/mongodbConfig'

const tableName = 'data_sources'

export interface IDataSource {
    id: string;
    type: string;
    name: string;
    uri: string;
    tags: string[];
}

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
  tags: {
    type: [String],
    required: false
  }
})

const model = mongoose.model<IDataSource>(tableName, schema)

const config = configFactory.buildConfig('data_source_manager')
export class DataSource implements IDataSource {
    public id: string;
    public type: string;
    public name: string;
    public uri: string;
    public tags: string[] = []

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
      }
    }

    // TODO refactor to be more dry
    private static connect (): Promise<void> {
      return new Promise((resolve, reject) => {
        mongoose.connect(config.getSeverUrl(), config.getMongooseOptions(), (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }

    static async count () : Promise<number> {
      await this.connect()
      return model.countDocuments()
    }

    static async findById (id: string): Promise<DataSource> {
      await this.connect()
      return new DataSource(await model.findOne({ id: id }).exec())
    }

    static async findAll (offset: number, count: number): Promise<Array<DataSource>> {
      DataSource.log.debug(`Fetching data sources from offset: ${offset} and count: ${count}`)
      await this.connect()
      return (await model.find().skip(offset).limit(count).exec()).map(doc => new DataSource(doc))
    }

    static async upsert (dataSource: DataSource): Promise<DataSource> {
      await this.connect()
      await model.updateOne({ id: dataSource.id }, dataSource.toDTO(), { upsert: true }).exec()
      return new DataSource(await model.findOne({
        id: dataSource.id
      }).exec())
    }

    static async has (id: string): Promise<boolean> {
      await this.connect()
      return await model.findOne({
        id: id
      }).exec() != null
    }

    static async delete (id: string): Promise<void> {
      await this.connect()
      await model.findByIdAndRemove(id).exec()
    }

    toDTO (): DataSourceDTO {
      return {
        id: this.id,
        type: this.type,
        name: this.name,
        uri: this.uri,
        tags: this.tags
      }
    }

    static fromDTO (dataSourceDTO: DataSourceDTO): DataSource {
      return new DataSource(dataSourceDTO)
    }
}
