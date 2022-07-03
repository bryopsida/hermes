import IORedis, { Redis, Cluster, NodeConfiguration, ClusterOptions } from 'ioredis'
import redisConfigFactory from '../config/redisConfig'

export class RedisClientFactory {
  static create (scope: string): Redis | Cluster {
    const redisConfig = redisConfigFactory.buildConfig(scope)
    if (redisConfig.cluster) {
      return new Cluster([{
        host: redisConfig.host,
        port: redisConfig.port
      } as NodeConfiguration], {
        enableReadyCheck: false,
        redisOptions: {
          password: redisConfig.password
        }
      } as ClusterOptions)
    } else {
      return new IORedis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password
      })
    }
  }
}
