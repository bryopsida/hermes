import { Queue, Job, DoneCallback } from "bull";
import  cluster from "cluster";
import os from 'os';
import createLogger from "../../common/logger/factory";
import { Producer } from 'node-rdkafka';
import COMPUTED_CONSTANTS from "../../common/computedConstants";
export interface HeartbeatTaskParams {}

export class HeartbeatTask {
    private readonly log = createLogger({
        serviceName: `heartbeat-task-${cluster.worker ? cluster.worker.id : os.hostname()}`,
        level: 'debug'
    })

    constructor(private queue: Queue, private kafkaProducer: Producer) {
        this.log.debug(`Heartbeat task initialized on queue ${queue.name}`);
        queue.process('heartbeat', this.processJob.bind(this));
        this.kafkaProducer.on('ready', () => {
            this.log.debug('Kafka producer ready');
        });
        this.kafkaProducer.on('event.error', (err) => {
            this.log.error(`Kafka producer error: ${err}`);
        });
        this.kafkaProducer.on('delivery-report', (err, report) => {
            if (err) {
                this.log.error(`Kafka producer delivery report error: ${err}`);
            } else {
                this.log.debug(`Kafka producer delivery report: ${report}`);
            }
        });
        this.kafkaProducer.setPollInterval(1000);
        this.kafkaProducer.connect();
    }

    // TODO: pick a better key value or leave as null
    private processJob(job: Job<HeartbeatTaskParams>, done: DoneCallback) {
        this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`);
        this.kafkaProducer.produce('heartbeats', null, Buffer.from(JSON.stringify({
            jobId: job.id,
            sourceQueue: job.queue.name,
            timestamp: job.timestamp,
            data: job.data
        })),COMPUTED_CONSTANTS.id as string, new Date().getTime());
        done();
    }
}