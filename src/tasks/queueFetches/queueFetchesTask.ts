import { DoneCallback, Job, Queue } from 'bull'
import { DataSourceClient } from '../../clients/dataSourcesClient'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { ITask } from '../../common/interfaces/task'
import createLogger from '../../common/logger/factory'
import { IPaginatedResponse } from '../../common/models/paginatedResponse'
import { DataSourceDTO } from '../../services/dataSources/dto/dataSource'
import { FetchTaskParams } from '../fetch/fetchTask'

export interface IQueueFetchOptions {
  baseUrl: string;
  batchSize: number;
}

export class QueueFetchesTask implements ITask {
  id: string;
  private readonly log = createLogger({
    serviceName: `queue-fetch-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (private queue: Queue) {
    this.id = `queue-fetches-${COMPUTED_CONSTANTS.id}`
    queue.process('queue_fetches', this.processJob.bind(this))
  }

  stop (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  private async processJob (job: Job<IQueueFetchOptions>, done: DoneCallback) {
    this.log.debug(`Processing job ${job.id} on queue ${job.queue.name}`)
    this.log.debug('Queueing fetch jobs for all data sources configured')

    // first find out how many data sources are stored
    // then iterate over all the data sources in batches
    // queue each individual data source as a fetch job
    // record the result in the done callback
    const client = new DataSourceClient(job.data.baseUrl)
    let fetchJobsQueued = 0
    let dataSourceResponse: IPaginatedResponse<DataSourceDTO> | null = null
    do {
      dataSourceResponse = await client.getDataSources(dataSourceResponse ? dataSourceResponse.offset + dataSourceResponse.limit : 0, job.data.batchSize || 1000)
      if (dataSourceResponse) {
        for (const dataSource of dataSourceResponse.items) {
          this.log.debug(`Queueing fetch job for data source id: ${dataSource.id}, type: ${dataSource.type}, name: ${dataSource.name}, uri: ${dataSource.uri}`)
          await this.queue.add('fetch', {
            name: dataSource.name,
            uri: dataSource.uri,
            type: dataSource.type,
            properties: {}
          } as FetchTaskParams)
          fetchJobsQueued++
        }
      }
    } while (dataSourceResponse && dataSourceResponse.items.length > 0)
    this.log.info(`Queued ${fetchJobsQueued} fetch jobs`)
    done(null, {
      jobQueueCount: fetchJobsQueued
    })
  }
}
