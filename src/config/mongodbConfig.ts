import config from 'config'

export interface IMongoDBConfig {
  getSeverUrl(): string,
  getMongooseOptions(): any,
  user: string,
  password: string,
  host: string,
  port: number,
  database: string
}
class MongoDbConfig {
  public readonly user: string;
  public readonly password: string;
  public readonly host: string;
  public readonly port: number;
  public readonly database: string;

  constructor (user: string, password: string, host: string, port: number, database: string) {
    this.user = user
    this.password = password
    this.host = host
    this.port = port
    this.database = database
  }

  public getSeverUrl (): string {
    return `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`
  }

  public getMongooseOptions (): any {
    return {
      user: this.user,
      pass: this.password
    }
  }
}

export default {
  buildConfig: (scope: string): IMongoDBConfig => {
    return config.get<MongoDbConfig>(`${scope}.mongo`)
  }
}
