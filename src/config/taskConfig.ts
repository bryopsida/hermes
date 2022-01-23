import config from 'config'

export interface IFetchTaskConfig {
  readonly batchSize: number
}

export default function buildConfig<T> (scope: string): T {
  return config.get<T>(`task_runner.tasks.${scope}`)
}
