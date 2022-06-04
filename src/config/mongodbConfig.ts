import config from 'config'

export interface IMongoDBConfigProps {
  readonly username: string,
  readonly password: string,
  readonly host: string,
  readonly port: number,
  readonly db: string,
  readonly authEnabled: boolean
}

export interface IMongoDBConfig extends IMongoDBConfigProps{
  getServerUrl(): string,
  getMongooseOptions(): any,
}

class MongoDbConfig {
  public readonly username: string
  public readonly password: string
  public readonly host: string
  public readonly port: number
  public readonly db: string
  public readonly authEnabled: boolean

  constructor (c: IMongoDBConfigProps) {
    this.username = c.username
    this.password = c.password
    this.host = c.host
    this.port = c.port
    this.db = c.db
    this.authEnabled = c.authEnabled
  }

  public getServerUrl (): string {
    return `mongodb://${this.host}:${this.port}/${this.db}`
  }

  public getMongooseOptions (): any {
    return {
      user: this.authEnabled ? this.username : undefined,
      pass: this.authEnabled ? this.password : undefined,
      dbName: this.db,
      authSource: this.authEnabled ? 'admin' : undefined
    }
  }
}

export default {
  buildConfig: (scope: string): IMongoDBConfig => {
    return new MongoDbConfig(config.get<IMongoDBConfigProps>(`${scope}.mongo`))
  }
}
