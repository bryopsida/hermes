import { WatchDTO } from '../dto/watch'
import knex from '../knex'

const tableName = 'watches'

export interface IWatch {
    id: number;
    name: string;
    description: string;
    graphql: string;
}

export class Watch implements IWatch {
    id: number;
    name: string;
    description: string;
    graphql: string;

    constructor (watch: IWatch | null = null) {
      if (watch) {
        this.id = watch.id
        this.name = watch.name
        this.description = watch.description
        this.graphql = watch.graphql
      } else {
        this.id = 0
        this.name = ''
        this.description = ''
        this.graphql = ''
      }
    }

    static async findAll (offset: number, count: number): Promise<Array<Watch>> {
      return (await knex).from(tableName).select('*').offset(offset).limit(count).then(function (rows) {
        return rows.map(row => {
          return new Watch(row)
        })
      })
    }

    static async upsert (watcb: Watch): Promise<Watch> {
      return (await knex).raw(
            `? ON CONFLICT (id)
                    DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description
                    graphql = EXCLUDED.graphql
                  RETURNING *;`,
            [(await knex)(tableName).insert(watcb)]
      )
    }

    static async delete (id: number): Promise<void> {
      await (await knex).from(tableName).where({ id: id }).delete()
    }

    static async has (id: number): Promise<boolean> {
      return (await knex).from(tableName).where({ id: id }).then(function (rows) {
        return rows.length > 0
      })
    }

    toDTO (): WatchDTO {
      return {
        id: this.id,
        description: this.description,
        name: this.name,
        graphql: this.graphql
      }
    }

    static fromDTO (watchDTO: WatchDTO): Watch {
      return new Watch(watchDTO)
    }
}
