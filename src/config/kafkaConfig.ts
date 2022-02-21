import config from 'config'

export interface IKafkaConfig {
  brokers: string[];
}

export default {
  buildConfig: (scope: string) : IKafkaConfig => {
    return config.get<IKafkaConfig>(`${scope}.kafka`)
  }
}
