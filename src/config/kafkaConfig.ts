import { GlobalConfig } from 'node-rdkafka'
import config from 'config'

const BROKER_KEY = 'kafka.brokerList'
const brokerList = config.has(BROKER_KEY) ? config.get<string>(BROKER_KEY) : 'localhost:9092'

export default {
  buildGlobalConfig: (groupdId: string) : GlobalConfig => ({
    'metadata.broker.list': brokerList
  })
}
