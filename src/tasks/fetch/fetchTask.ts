import { Queue, Job } from 'bull'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import createLogger from '../../common/logger/factory'
import axios, { AxiosRequestConfig } from 'axios'
import { ProducerTask } from '../producerTask'
import { Producer } from 'node-rdkafka'
import { IUnprocesseedJsonData } from '../../common/models/watchModels'


export interface FetchTaskParams {
    name: string;
    uri: string;
    type: string;
    properties: Record<string, unknown>;
}
export interface LogMethod {
    (message: string): void;
}

/**
 * Task responsible for processing a fetch request
 * generated by @see QueueFetchesTask retrieved data is
 * published into kafka for further processing by actors
 * @see JsonProcessorActor and @see JsonWatchActor
 */
export class FetchTask extends ProducerTask {
  static readonly ID = 'fetch'
  id = FetchTask.ID
  protected readonly log = createLogger({
    serviceName: `fetch-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (queue: Queue, kafkaProducer: Producer) {
    super(queue, FetchTask.ID, kafkaProducer)
    this.log.debug(`Fetch task initialized on queue ${queue.name}`)
  }

  private isNewData (uri: string): Promise<boolean> {
    // TODO: make this smarter, for now we will fetch every time
    return Promise.resolve(true)
  }

  private async getRequestOptions (uri: string, properties: Record<string, unknown>): Promise<AxiosRequestConfig> {
    const opts: AxiosRequestConfig = {
      url: uri,
      method: properties.method as string || 'GET',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json'
      }
    }
    if (properties.credentials) {
      this.log.debug('Setting credentials')
      const creds = properties.credentials as Record<string, string>
      switch (creds.type) {
        case 'digest':
        case 'basic': {
          opts.auth = {
            username: creds.username,
            password: creds.password
          }
          break
        }
        case 'apiKey': {
          const headers = opts.headers as Record<string, string>
          headers[creds.apiKeyHeader] = creds.apiKey
          break
        }
      }
    }
    return Promise.resolve(opts)
  }

  private async fetchData (uri: string, properties: Record<string, unknown>): Promise<unknown> {
    // TODO: in the future support more than get
    const response = await axios.request(await this.getRequestOptions(uri, properties))
    return response.data
  }

  protected publish (data: unknown, job: Job<unknown>): Promise<void> {
    this.kafkaProducer.produce('jsonData', null, Buffer.from(JSON.stringify({
      jobId: job.id,
      sourceQueue: job.queue.name,
      timestamp: job.timestamp,
      data
    } as IUnprocesseedJsonData)), COMPUTED_CONSTANTS.id as string, new Date().getTime())
    return Promise.resolve()
  }

  private isJson (data: unknown) : boolean {
    if (typeof data === 'string') {
      try {
        JSON.parse(data)
        return true
      } catch (err) {
        return false
      }
    } else if (typeof data === 'object' || Array.isArray(data)) {
      return true
    } else {
      return false
    }
  }

  private getFullUrl (uri: string) : string {
    if (!uri) throw new Error('Undefined URI provided')
    if (uri.startsWith('http')) {
      return uri
    } else {
      return `https://${uri}`
    }
  }

  override async processJob (job: Job<FetchTaskParams>) : Promise<unknown> {
    if (job.data.name == null || job.data.uri == null) throw new Error('Missing name or uri')
    this.logToJob(`Processing job ${job.id} on queue ${job.queue.name}`, job)
    this.logToJob(`Checking if there is new data sources for ${job.data.name} at ${job.data.uri}`, job)
    const fullUri = this.getFullUrl(job.data.uri)
    if (!await this.isNewData(fullUri)) {
      this.logToJob(`No new data sources for ${job.data.name} at ${job.data.uri}`, job)
      return
    }

    this.logToJob(`New data, fetching data sources for ${job.data.name} at ${job.data.uri}`, job)
    const data = await this.fetchData(fullUri, job.data.properties)

    if (!this.isJson(data)) {
      this.logToJob(`Data is not JSON for ${job.data.name} at ${job.data.uri}, data: ${data}`, job)
      return
    }

    this.logToJob(`Publishing data for ${job.data.name} at ${job.data.uri}`, job)
    await this.publish(data, job)
    this.logToJob(`Done with job ${job.id} on queue ${job.queue.name}`, job)
    return data
  }

  public async stop (): Promise<void> {
    await this.queue.close()
  }
}
