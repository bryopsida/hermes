// fetch, and process a manifest of data sources, based on configuration, maintain list of

import { Queue, Job, DoneCallback } from "bull";
import  cluster from "cluster";
import os from 'os';
import createLogger from "../../common/logger/factory";

export interface DiscoverTaskParams {
    name: string;
    manifestUri: string;
    type: string;
    properties: Record<string, unknown>;
}

// discovered data sources that match criteria by interfacing with dataSources service
export class DiscoverTask {
    private readonly log = createLogger({
        serviceName: `discover-task-${cluster.worker ? cluster.worker.id : os.hostname()}`,
        level: 'debug'
    })

    constructor(private queue: Queue) {
        this.log.debug(`Discover task initialized on queue ${queue.name}`);
        queue.process(this.processJob);
    }

    private processJob(job: Job<DiscoverTaskParams>, done: DoneCallback) {
        this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`);
        this.log.debug(`Discovering data sources for ${job.data.name} from ${job.data.manifestUri}`);

        //TODO: fetch

        //TODO: check against conditions set in properties based on type

        //TODO: use dataSources client to check if source exists, if not create it
    }
}