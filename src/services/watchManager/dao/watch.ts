import { WatchDTO } from '../dto/watch'
import mongoose, { Connection } from 'mongoose'
import configFactory from '../../../config/mongodbConfig'
import { randomUUID } from 'crypto'
import { using } from '../../../common/using'

const tableName = 'watches'

export interface IWatch {
    id: string;
    name: string;
    description: string;
    graphql: string;
}

const schema = new mongoose.Schema<IWatch>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  graphql: {
    type: String,
    required: true
  }
})

const config = configFactory.buildConfig('watch_manager')

export class Watch implements IWatch {
  id: string
  name: string
  description: string
  graphql: string

  constructor (watch: IWatch | null = null) {
    if (watch) {
      this.id = watch.id
      this.name = watch.name
      this.description = watch.description
      this.graphql = watch.graphql
    } else {
      this.id = randomUUID()
      this.name = ''
      this.description = ''
      this.graphql = ''
    }
  }

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

  private static getModel (conn: mongoose.Connection): mongoose.Model<IWatch> {
    return conn.model(tableName, schema)
  }

  static async count () : Promise<number> {
    return using<Connection, number>(await this.connect(), async (conn) => {
      return this.getModel(conn).countDocuments().exec()
    })
  }

  static async findAll (offset: number, count: number): Promise<Array<Watch>> {
    return using<Connection, Array<Watch>>(await this.connect(), async (conn) => {
      const model = this.getModel(conn)
      return (await model.find().skip(offset).limit(count).exec()).map(doc => new Watch(doc))
    })
  }

  static async findById (id: string): Promise<Watch> {
    return using<Connection, Watch>(await this.connect(), async (conn) => {
      return new Watch(await this.getModel(conn).findOne({ id }).exec())
    })
  }

  static async upsert (watcb: Watch): Promise<Watch> {
    return using<Connection, Watch>(await this.connect(), async (conn) => {
      const model = this.getModel(conn)
      await model.updateOne({ id: watcb.id }, watcb.toDTO(), { upsert: true }).exec()
      return new Watch(await model.findOne({
        id: watcb.id
      }).exec())
    })
  }

  static async delete (id: string): Promise<void> {
    return using<Connection, void>(await this.connect(), async (conn) => {
      await this.getModel(conn).deleteOne({ id }).exec()
    })
  }

  static async has (id: string): Promise<boolean> {
    return using<Connection, boolean>(await this.connect(), async (conn) => {
      return (await this.getModel(conn).findOne({ id }).exec()) !== null
    })
  }

  toDTO (): WatchDTO {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      graphql: this.graphql
    }
  }

  static fromDTO (watchDTO: WatchDTO): Watch {
    return new Watch({
      id: watchDTO.id,
      name: watchDTO.name,
      description: watchDTO.description,
      graphql: watchDTO.graphql
    })
  }
}
