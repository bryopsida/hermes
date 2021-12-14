import { Queue, Job, DoneCallback } from "bull";
import COMPUTED_CONSTANTS from "../../common/computedConstants";
import { ITask } from "../../common/interfaces/task";
import createLogger from "../../common/logger/factory";

export interface FetchTaskParams {
    name: string;
    uri: string;
    type: string;
    properties: Record<string, unknown>;
}

export class FetchTask implements ITask {
    id = 'fetch';
    private readonly log = createLogger({
        serviceName: `fetch-task-${COMPUTED_CONSTANTS.id}`,
        level: 'debug'
    })

    constructor(private queue: Queue) {
        this.log.debug(`Fetch task initialized on queue ${queue.name}`);
        queue.process(this.processJob);
    }

    private processJob(job: Job<FetchTaskParams>, done: DoneCallback) {
        this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`);
        this.log.debug(`Checking if there is new data sources for ${job.data.name} at ${job.data.uri}`);

        //TODO: check headers etc to see if there is new data

        //TODO: if there is new data fetch it

        //TODO: if we have new data publish it to the stream for processing

        //Long term TODO: for big datasets determine mechanisms for publishing incremental values, perhaps by specifying queries that reduce the data set to an array in a way that can be processed incrementally
    }

    public async stop(): Promise<void> {
        await this.queue.close();
    }
}