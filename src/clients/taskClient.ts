import { ITaskClient, ITaskEntry } from '../factories/taskClientFactory'

export class TaskClient implements ITaskClient {
  cancelTask (jobId: string): Promise<ITaskEntry> {
    throw new Error('Method not implemented.')
  }

  getTask (jobId: string): Promise<ITaskEntry> {
    throw new Error('Method not implemented.')
  }

  addTask (taskOptions: unknown): Promise<ITaskEntry> {
    throw new Error('Method not implemented.')
  }
}
