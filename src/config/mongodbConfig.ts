import config from 'config'

const HOST_KEY = 'mongodb.host'
const PORT_KEY = 'mongodb.port'
const USER_KEY = 'mongodb.user'
const PASSWORD_KEY = 'mongodb.password'
const DATABASE_KEY = 'mongodb.database'

export interface IMongoDBConfig {
  serverUrl: string
}

export default {
  buildConfig: (scope: string): IMongoDBConfig => {
    const hostKey = `${scope}.${HOST_KEY}`
    const portKey = `${scope}.${PORT_KEY}`
    const passwordKey = `${scope}.${PASSWORD_KEY}`
    const databaseKey = `${scope}.${DATABASE_KEY}`
    const userKey = `${scope}.${USER_KEY}`

    const host = config.has(hostKey) ? config.get<string>(hostKey) : 'localhost'
    const port = config.has(portKey) ? config.get<number>(portKey) : 27017
    const password = config.has(passwordKey) ? config.get<string>(passwordKey) : 'mongodb'
    const user = config.has(userKey) ? config.get<string>(userKey) : 'mongodb'
    const database = config.has(databaseKey) ? config.get<string>(databaseKey) : scope

    return {
      serverUrl: `mongodb://${user}:${password}@${host}:${port}/${database}`
    }
  }
}
