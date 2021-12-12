import { GlobalConfig } from "node-rdkafka";

const brokerList = process.env.KAFKA_BROKER_LIST || "localhost:29092";
export default {
  buildGlobalConfig: (groupdId: string) : GlobalConfig => ({
    'metadata.broker.list': brokerList
  })
}