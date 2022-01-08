import COMPUTED_CONSTANTS from '../../../common/computedConstants'
import createLogger from '../../../common/logger/factory'
import { DataSourceDTO } from '../dto/dataSource'
import mongoose from 'mongoose'

const tableName = 'data_sources'

export interface IDataSource {
    id: string;
    type: string;
    name: string;
    uri: string;
}

export class DataSource implements IDataSource {
    public id: string;
    public type: string;
    public name: string;
    public uri: string;

    

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

    static async count () : Promise<number> {
      return (await knex).from(tableName).count('* as count')
    }

    static async findAll (offset: number, count: number): Promise<Array<DataSource>> {
      DataSource.log.debug(`Fetching data sources from offset: ${offset} and count: ${count}`)
      return (await knex).from(tableName).select('*').offset(offset).limit(count).then(function (rows) {
        return rows.map(row => {
          return new DataSource(row)
        })
      })
    }

    static async upsert (dataSource: DataSource): Promise<DataSource> {
      return (await knex).raw(
            `? ON CONFLICT (id)
                    DO UPDATE SET
                    name = EXCLUDED.name,
                    uri = EXCLUDED.uri
                  RETURNING *;`,
            [(await knex)(tableName).insert(dataSource)]
      )
    }

    static async has (id: number): Promise<boolean> {
      return (await knex).from(tableName).where({ id }).count('* as count').then(function (rows) {
        return rows.length > 0
      })
    }

    static async delete (id: number): Promise<void> {
      return (await knex).from(tableName).where({ id }).del()
    }

    toDTO (): DataSourceDTO {
      return {
        id: this.id,
        type: this.type,
        name: this.name,
        uri: this.uri
      }
    }

    static fromDTO (dataSourceDTO: DataSourceDTO): DataSource {
      return new DataSource(dataSourceDTO)
    }
}
