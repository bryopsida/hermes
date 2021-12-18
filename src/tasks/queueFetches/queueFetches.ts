import { DoneCallback, Job, Queue } from "bull";
import COMPUTED_CONSTANTS from "../../common/computedConstants";
import { ITask } from "../../common/interfaces/task";
import createLogger from "../../common/logger/factory";

export class QueueFetches implements ITask {
  
  id: string;
  private readonly log = createLogger({
    serviceName: `queue-fetch-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor(private queue: Queue) {
    this.id = `queue-fetches-${COMPUTED_CONSTANTS.id}`;
    queue.process('heartbeat', this.processJob.bind(this));
  }
  
  stop(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private processJob(job: Job<any>, done: DoneCallback) {
    this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`);
    this.log.debug(`Queueing fetch jobs for all data sources configured`);
  }

}