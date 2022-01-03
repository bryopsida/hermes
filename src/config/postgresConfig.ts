import config from 'config'

const HOST_KEY = 'postgres.host'
const PORT_KEY = 'postgres.port'
const PASSWORD_KEY = 'postgres.password'
const DATABASE_KEY = 'postgres.database'
const USER_KEY = 'postgres.user'
export interface IPostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export default {
  buildPostgresConfig: (scope: string): IPostgresConfig => {
    return {
      host: config.has(HOST_KEY) ? config.get<string>(HOST_KEY) : 'localhost',
      port: config.has(PORT_KEY) ? config.get<number>(PORT_KEY) : 5432,
      password: config.has(PASSWORD_KEY) ? config.get<string>(PASSWORD_KEY) : 'postgres',
      database: config.has(DATABASE_KEY) ? config.get<string>(DATABASE_KEY) : 'datasource_watch',
      user: config.has(USER_KEY) ? config.get<string>(USER_KEY) : 'postgres'
    }
  }
}
