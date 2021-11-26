import { DataSourceDTO } from "../dto/dataSource"
import knex from '../knex';

const tableName = 'data_sources';

export interface IDataSource {
    id: string;
    type: string;
    name: string;
    uri: string;
    tags: Array<string>;
}

export class DataSource implements IDataSource {
    
    public id: string;
    public type: string;
    public name: string;
    public uri: string;
    public tags: Array<string>;

    constructor(dataSource: IDataSource | null = null) {
        if ( dataSource == null) {
            this.id = '';
            this.type = '';
            this.name = '';
            this.uri = '';
            this.tags = [];
        } else {
            this.id = dataSource.id;
            this.type = dataSource.type;
            this.name = dataSource.name;
            this.uri = dataSource.uri;
            this.tags = dataSource.tags;
        }
    }

    static async findAll(offset: number, count: number): Promise<Array<DataSource>> {
        return (await knex).from(tableName).select('*').offset(offset).limit(count).then(function(rows) {
            return rows.map(row => {
                return new DataSource(row);
            });
        });
    }

    static async upsert(dataSource: DataSource): Promise<DataSource> {
        return (await knex).raw(
            `? ON CONFLICT (id)
                    DO UPDATE SET
                    name = EXCLUDED.name,
                    uri = EXCLUDED.uri
                  RETURNING *;`,
            [(await knex)(tableName).insert(dataSource)],
          );
    }
    
    toDTO(): DataSourceDTO {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            uri: this.uri,
            tags: this.tags
        }
    }

    static fromDTO(dataSourceDTO: DataSourceDTO): DataSource {
        return new DataSource(dataSourceDTO);
    }
}