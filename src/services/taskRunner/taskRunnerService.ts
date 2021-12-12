import { IService } from "../../common/interfaces/service";
import BullQueue, { Queue, QueueOptions } from 'bull';
import createLogger from "../../common/logger/factory";
import cluster from "cluster";
import os from 'os';
import { FetchTask } from "../../tasks/fetch/fetchTask";
import { HeartbeatTask } from "../../tasks/heartbeat/heartbeatTask";
import { QueueNames } from "../../common/queues/queueNameConstants";
import kafkaTopicConfig from "../../common/ topics/kafkaTopicConfig";
import { Producer } from 'node-rdkafka';


export class TaskRunnerService  implements IService {

    private readonly _queues: Map<QueueNames, Queue> = new Map();

    private readonly log = createLogger({
        serviceName: `task-runner-${cluster.worker ? cluster.worker.id : os.hostname()}`,
        level: 'debug'
    })

    constructor(private _queueOptions: QueueOptions) {}

    public async start(): Promise<void> {
        this.log.info('Starting task runner service');
        
        // TODO: refactor be clean, generic
        const FETCH_QUEUE = new BullQueue(QueueNames.FETCH_QUEUE, this._queueOptions);
        FETCH_QUEUE.on('error', (error) => {
            this.log.error('Error in fetch queue', error);
        });
        
        const HEARTBEAT_QUEUE = new BullQueue(QueueNames.HEARTBEAT_QUEUE, this._queueOptions);
        HEARTBEAT_QUEUE.on('Error in heartbeat queue', (error) => {
            this.log.error(error);
        });
        HEARTBEAT_QUEUE.add('heartbeat', {}, { repeat: { cron: '*/1 * * * *' } });
        
        this._queues.set(QueueNames.FETCH_QUEUE, FETCH_QUEUE);
        this._queues.set(QueueNames.HEARTBEAT_QUEUE, HEARTBEAT_QUEUE);

        // load seed tasks from json file

        // TODO: this smells, evaluate and refactor
        new FetchTask(this._queues.get(QueueNames.FETCH_QUEUE) as Queue);
        new HeartbeatTask(this._queues.get(QueueNames.HEARTBEAT_QUEUE) as Queue, new Producer({
            'metadata.broker.list': 'localhost:29092',
        }, kafkaTopicConfig.heartbeat));


        return Promise.resolve();
    }

    public stop(): Promise<void> {
        this.log.info('Stopping task runner service');
        return Promise.all(Array.from(this._queues.values()).map(queue => queue.close())).then(() => {
            return Promise.resolve();
        });
    }
    async destroy(): Promise<void> {
        await this.stop();
    }
}
