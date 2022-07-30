import { TaskClient } from '../clients/taskClient'

export interface ITaskClientOptions {

}
export enum TaskState {
  // eslint-disable-next-line no-unused-vars
  PENDING = 'PENDING',
  // eslint-disable-next-line no-unused-vars
  RUNNING = 'RUNNING',
  // eslint-disable-next-line no-unused-vars
  COMPLETED = 'COMPLETED',
  // eslint-disable-next-line no-unused-vars
  FAILED = 'FAILED',
  // eslint-disable-next-line no-unused-vars
  CANCELLED = 'CANCELLED'
}
export interface ITaskCore {
  jobId: string
}
export interface ITaskResult extends ITaskCore {
  result: unknown
  finishedTime: Date
  startTime: Date
  attempts: number
  getLogs(): Promise<string>
}
export interface ITaskEntry extends ITaskCore {
  state: TaskState,
  progress: number,
  getResult(): Promise<ITaskResult>
}
export interface ITaskClient {
  cancelTask(jobId: string): Promise<ITaskEntry>
  getTask(jobId: string): Promise<ITaskEntry>
  addTask(taskOptions: unknown): Promise<ITaskEntry>
}
export interface ITaskClientFactory {
  createClient (opts: ITaskClientOptions) : Promise<ITaskClient>
}
export class TaskClientFactory implements ITaskClientFactory {
  createClient (opts: ITaskClientOptions): Promise<ITaskClient> {
    return Promise.resolve(new TaskClient())
  }
}
