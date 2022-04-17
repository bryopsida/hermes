import COMPUTED_CONSTANTS from '../../../common/computedConstants'
import createLogger from '../../../common/logger/factory'
import { UserDTO } from '../dto/user'
import mongoose, { Connection } from 'mongoose'
import configFactory from '../../../config/mongodbConfig'
import { using } from '../../../common/using'
import { randomUUID } from 'crypto'

const tableName = 'users'

export interface IUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isLocked: boolean;
  lastActivity?: Date;
  joined: Date;
  tags: string[];
  password?: string;
}

const schema = new mongoose.Schema<IUser>({
  id: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  isLocked: {
    type: Boolean,
    required: true
  },
  lastActivity: {
    type: Date,
    required: false
  },
  joined: {
    type: Date,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    required: false
  }
})

const config = configFactory.buildConfig('user_manager')
export class User implements IUser {
  public id: string
  public username: string
  public email: string
  public firstName?: string
  public lastName?: string
  public isLocked: boolean
  public lastActivity?: Date
  public joined: Date
  public password?: string
  public tags: string[]

  private static readonly log = createLogger({
    serviceName: `user-dao-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (user: IUser | null = null) {
    if (user == null) {
      this.id = randomUUID()
      this.email = ''
      this.firstName = undefined
      this.lastName = undefined
      this.isLocked = false
      this.lastActivity = undefined
      this.joined = new Date()
      this.password = ''
      this.tags = []
      this.username = ''
    } else {
      this.id = user.id
      this.email = user.email
      this.firstName = user.firstName
      this.lastName = user.lastName
      this.isLocked = user.isLocked
      this.lastActivity = user.lastActivity
      this.joined = user.joined
      this.password = user.password
      this.tags = user.tags
      this.username = user.username
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

  private static getModel (conn: Connection): mongoose.Model<IUser> {
    return conn.model(tableName, schema)
  }

  static async count () : Promise<number> {
    return using<Connection, number>(await this.connect(), async (conn) => {
      return this.getModel(conn).countDocuments()
    })
  }

  static async findById (id: string): Promise<User> {
    return using<Connection, User>(await this.connect(), async (conn) => {
      return new User(await this.getModel(conn).findOne({ id: id }).exec())
    })
  }

  static async findAll (offset: number, count: number): Promise<Array<User>> {
    if (offset == null || isNaN(offset)) {
      User.log.warn('offset is not defined or NaN, defaulting to 0')
      offset = 0
    }
    if (count == null || isNaN(count)) {
      User.log.warn('count is not defined or NaN, defaulting to 10')
      count = 10
    }
    User.log.debug(`Fetching data sources from offset: ${offset} and count: ${count}`)
    const conn = await this.connect()
    const result = (await this.getModel(conn).find().skip(offset).limit(count).exec()).map(doc => new User(doc))
    await conn.close()
    return result
  }

  static async upsert (dataSource: User): Promise<User> {
    return using<Connection, User>(await this.connect(), async (conn) => {
      const model = this.getModel(conn)
      await model.updateOne({ id: dataSource.id }, dataSource.toDTO(), { upsert: true }).exec()
      return new User(await model.findOne({
        id: dataSource.id
      }).exec())
    })
  }

  static async has (id: string): Promise<boolean> {
    return using<Connection, boolean>(await this.connect(), async (conn) => {
      return (await this.getModel(conn).findOne({ id: id }).exec()) !== null
    })
  }

  static async delete (id: string): Promise<void> {
    return using<Connection, void>(await this.connect(), async (conn) => {
      await this.getModel(conn).deleteOne({ id: id }).exec()
    })
  }

  toDTO (): UserDTO {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isLocked: this.isLocked,
      lastActivity: this.lastActivity,
      joined: this.joined,
      tags: this.tags
    }
  }

  static fromDTO (userDto: UserDTO): User {
    return new User({
      id: userDto.id,
      username: userDto.username,
      email: userDto.email,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      isLocked: userDto.isLocked,
      lastActivity: userDto.lastActivity,
      joined: userDto.joined,
      tags: userDto.tags,
      password: undefined
    })
  }

  // avoid inclusion of password in conversion to string
  toString () {
    return `User(id: ${this.id}, username: ${this.username}, email: ${this.email}, firstName: ${this.firstName}, lastName: ${this.lastName}, isLocked: ${this.isLocked}, lastActivity: ${this.lastActivity}, joined: ${this.joined}, tags: ${this.tags})`
  }

  // avoid inclusion of password in the serialized object, if serialized
  toJSON () {
    return this.toDTO()
  }
}
