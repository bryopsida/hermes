import config from 'config'

const HOST_KEY = 'redis.host'
const PORT_KEY = 'redis.port'
const PASSWORD_KEY = 'redis.password'

export interface IRedisConfig {
  host: string;
  port: number;
  password: string;
}

export default {
  buildQueueConfig: (scope: string): IRedisConfig => {
    return {
      host: config.has(HOST_KEY) ? config.get<string>(HOST_KEY) : 'localhost',
      port: config.has(PORT_KEY) ? config.get<number>(PORT_KEY) : 6379,
      password: config.has(PASSWORD_KEY) ? config.get<string>(PASSWORD_KEY) : 'postgres'
    }
  }
}
