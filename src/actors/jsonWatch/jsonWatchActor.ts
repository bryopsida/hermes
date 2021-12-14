import COMPUTED_CONSTANTS from "../../common/computedConstants";
import { IActor } from "../../common/interfaces/actor";
import createLogger from "../../common/logger/factory";
import { IJsonWatchResult, IWatchedJsonData } from "../../common/models/watchModels";
import { KafkaConsumer, Message } from 'node-rdkafka';
import kafkaTopicConfig from "../../common/ topics/kafkaTopicConfig";

export class JsonWatchActor implements IActor<IWatchedJsonData, IJsonWatchResult> {

    private readonly log = createLogger({
        serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
        level: 'debug'
    })

    readonly name: string;
    readonly topic: string;
    kafkaConsumer?: KafkaConsumer;

    constructor(){
        this.name = "jsonWatchActor";
        this.topic = "json-data";
        this.log.info(`${this.name} actor created`);
    }
    
    actOn(message: IWatchedJsonData): Promise<IJsonWatchResult> {
        throw new Error("Method not implemented.");
    }

    private onReady() : void {
        this.log.info(`${this.name} actor ready`);
        this.kafkaConsumer?.subscribe([this.topic]);
        this.kafkaConsumer?.consume();
    }

    private async onData(data: Message) : Promise<void> {
        if (!data.value) {
            this.log.warn(`${this.name} actor received empty message`);
            return Promise.resolve();
        }
        const message: IWatchedJsonData = JSON.parse(data.value.toString());
        this.log.debug(`${this.name} actor received message`);
        await this.actOn(message);
    }
    
    startProcessing(): Promise<void> {
        this.kafkaConsumer = new KafkaConsumer({
            'group.id': this.name,
            'metadata.broker.list': process.env.KAFKA_BROKER_LIST || 'localhost:29092'
        }, kafkaTopicConfig["json-data"]);
        
        this.kafkaConsumer.connect();
        this.kafkaConsumer.on('ready', this.onReady.bind(this));
        this.kafkaConsumer.on('data', this.onData.bind(this));

        this.log.debug(`${this.name} actor started`);
        // create kafka consumer and point to acton
        return Promise.resolve();
    }
    
    stopProcessing(): Promise<void> {
        this.log.debug(`${this.name} actor stopped`);
        this.kafkaConsumer?.unsubscribe();
        this.kafkaConsumer?.removeAllListeners();
        this.kafkaConsumer?.disconnect();
        // clean up kafka consumer
        return Promise.resolve();
    }
}