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

const config = configFactory.buildConfig('watches')

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

    static async findAll (offset: number, count: number): Promise<Array<Watch>> {
      await mongoose.connect(config.serverUrl)
      return (await model.find().limit(count).skip(offset).exec()).map(doc => new Watch(doc))
    }

    static async upsert (watcb: Watch): Promise<Watch> {
      await mongoose.connect(config.serverUrl)
      return new Watch(await model.findOneAndUpdate({ id: watcb.id }, watcb.toDTO(), { upsert: true, new: true }).exec())
    }

    static async delete (id: number): Promise<void> {
      await mongoose.connect(config.serverUrl)
      await model.findByIdAndDelete(id).exec()
    }

    static async has (id: number): Promise<boolean> {
      await mongoose.connect(config.serverUrl)
      return await model.findById(id).exec() != null
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
