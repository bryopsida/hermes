import { IService } from "../../common/interfaces/service";
import bull, { Queue, QueueOptions } from 'bull';
import createLogger from "../../common/logger/factory";
import cluster from "cluster";
import os from 'os';
import { DiscoverTask } from "../../tasks/discover/discoverTask";
import { FetchTask } from "../../tasks/fetch/fetchTask";

export enum QueueNames {
    DISCOVER_QUEUE = 'discover-queue',
    FETCH_QUEUE = 'fetch-queue'
}

export class TaskRunnerService  implements IService {

    private readonly _queues: Map<QueueNames, Queue> = new Map();

    private readonly log = createLogger({
        serviceName: `task-runner-${cluster.worker ? cluster.worker.id : os.hostname()}`,
        level: 'debug'
    })

    constructor(private _queueOptions: QueueOptions) {}

    public start(): Promise<void> {
        this.log.info('Starting task runner service');
        this._queues.set(QueueNames.DISCOVER_QUEUE, new bull(QueueNames.DISCOVER_QUEUE.toString(), this._queueOptions));
        this._queues.set(QueueNames.FETCH_QUEUE, new bull(QueueNames.FETCH_QUEUE.toString(), this._queueOptions));

        // TODO: this smells, evaluate and refactor
        new DiscoverTask(this._queues.get(QueueNames.DISCOVER_QUEUE) as Queue);
        new FetchTask(this._queues.get(QueueNames.FETCH_QUEUE) as Queue);
        return Promise.resolve();
    }

    public stop(): Promise<void> {
        this.log.info('Stopping task runner service');
        return Promise.all(Array.from(this._queues.values()).map(queue => queue.close())).then(() => {
            return Promise.resolve();
        });
    }
}
