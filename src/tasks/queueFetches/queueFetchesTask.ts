import { DoneCallback, Job, Queue } from 'bull'
import { DataSourceClient } from '../../clients/dataSourcesClient'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { ITask } from '../../common/interfaces/task'
import createLogger from '../../common/logger/factory'
import { IPaginatedResponse } from '../../common/models/paginatedResponse'
import { ClientCredentialProviderFactory } from '../../factories/clientCredentialProvider'
import { DataSourceDTO } from '../../services/dataSourceManager/dto/dataSource'
import { FetchTaskParams } from '../fetch/fetchTask'
import config from 'config'

export interface IQueueFetchOptions {
  baseUrl: string;
  batchSize: number;
}

/**
 * This task interfaces with the data source manager
 * fetching the data sources and kicking off individual jobs
 * to check each data source for new data and push it into the message busses.
 *
 * When credentials are present a data encryption key is generated and used to encrypt the credentials.
 * The DEK is sealed with a master key specified in the config file. The task responsible for executing the request
 * will unseal the DEK, decrypt the credentials and then use the credentials to make the request.
 */
export class QueueFetchesTask implements ITask {
  id: string
  private readonly log = createLogger({
    serviceName: `queue-fetch-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (private queue: Queue) {
    this.id = `queue-fetches-${COMPUTED_CONSTANTS.id}`
    queue.process('queue_fetches', this.processJob.bind(this))
  }

  stop (): Promise<void> {
    this.log.info('Stopping queue fetches task')
    return Promise.resolve()
  }

  private async processJob (job: Job<IQueueFetchOptions>, done: DoneCallback) {
    this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`)
    this.log.debug('Queueing fetch jobs for all data sources configured')

    // first find out how many data sources are stored
    // then iterate over all the data sources in batches
    // queue each individual data source as a fetch job
    // record the result in the done callback
    const client = new DataSourceClient({
      baseUrl: job.data.baseUrl,
      loggerEnabled: false,
      credentialProvider: ClientCredentialProviderFactory.create(config)
    })

    let fetchJobsQueued = 0
    let dataSourceResponse: IPaginatedResponse<DataSourceDTO> | null = null
    const count = (job.data != null && job.data.batchSize != null) ? job.data.batchSize : 1000
    let offset = 0
    try {
      do {
        dataSourceResponse = await client.getDataSources(offset, count)
        if (dataSourceResponse) {
          for (const dataSource of dataSourceResponse.items) {
            this.log.debug(`Queueing fetch job for data source id: ${dataSource.id}, type: ${dataSource.type}, name: ${dataSource.name}, uri: ${dataSource.uri}`)
            const fetchTaskParams: FetchTaskParams = {
              id: dataSource.id,
              name: dataSource.name,
              uri: dataSource.uri,
              type: dataSource.type,
              properties: {
                hasCredentials: dataSource.hasCredentials
              }
            }
            if (dataSource.hasCredentials) {
              const fullDataSource = await client.getDataSource(dataSource.id, true)
              fetchTaskParams.properties.credentials = fullDataSource.credentials
            }
            await this.queue.add('fetch', fetchTaskParams)
            fetchJobsQueued++
          }
        } else {
          this.log.warn('Response undefined, exiting!')
          break
        }
        offset += count
      } while (dataSourceResponse && dataSourceResponse.items.length === count)
      this.log.info(`Queued ${fetchJobsQueued} fetch jobs`)
      done(null, {
        jobQueueCount: fetchJobsQueued
      })
    } catch (err: unknown) {
      this.log.error(`Error queueing fetch jobs: ${err}`)
      done(err as Error)
    }
  }
}
