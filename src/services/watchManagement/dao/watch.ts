import { WatchDTO } from '../dto/watch'
import mongoose from 'mongoose'
import configFactory from '../../../config/mongodbConfig'
import { randomUUID } from 'crypto'

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

const model = mongoose.model<IWatch>(tableName, schema)

const config = configFactory.buildConfig('watch_manager')

export class Watch implements IWatch {
    id: string;
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
        this.id = randomUUID()
        this.name = ''
        this.description = ''
        this.graphql = ''
      }
    }

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

    static async findAll (offset: number, count: number): Promise<Array<Watch>> {
      await this.connect()
      return (await model.find().limit(count).skip(offset).exec()).map(doc => new Watch(doc))
    }

    static async findById (id: string): Promise<Watch> {
      await this.connect()
      return new Watch(await model.findOne({ id: id }).exec())
    }

    static async upsert (watcb: Watch): Promise<Watch> {
      await this.connect()
      await model.updateOne({ id: watcb.id }, watcb.toDTO(), { upsert: true }).exec()
      return new Watch(await model.findOne({ id: watcb.id }).exec())
    }

    static async delete (id: string): Promise<void> {
      await this.connect()
      await model.findByIdAndDelete(id).exec()
    }

    static async has (id: string): Promise<boolean> {
      await this.connect()
      return await model.findOne({
        id: id
      }).exec() != null
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
