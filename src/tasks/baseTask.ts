import { DoneCallback, Job, Queue } from 'bull'
import { Logger } from 'pino'
import { ITask } from '../common/interfaces/task'

export abstract class BaseTask implements ITask {
  public abstract id: string;
  protected abstract log: Logger;
  protected shouldExecuteImmediately: boolean = false;
  protected readonly queue: Queue;

  protected constructor (queue: Queue, name: string) {
    this.queue = queue
    // processor is registered for the queue
    queue.process(name, this.run.bind(this))
    this.shouldBeQueued().then((should) => {
      if (should) {
        this.log.debug(`Queueing ${this.id}`)
        this.queue.add(this.id, {})
      }
    })
  }

  protected async run (job: Job<any>, done: DoneCallback) : Promise<unknown> {
    try {
      const result = await this.processJob(job)
      done(null, result)
      return result
    } catch (err) {
      this.logToJob(`Error while executing job ${this.id} on ${this.queue.name}:  ${err}`, job, 'error')
      done(err as Error)
    }
  }

  async stop (): Promise<void> {
    await this.queue.close()
  }

  abstract processJob (job: Job<any>): Promise<unknown>;
  protected shouldBeQueued (): Promise<boolean> {
    return Promise.resolve(true)
  }

  protected logToJob (message: string, job: Job<any>, level: string = 'debug'): void {
    (this.log as any)[level](`${message}`)
    job.log(message)
  }
}
