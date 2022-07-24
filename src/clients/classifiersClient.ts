import axios, { AxiosRequestConfig } from 'axios'
import { Logger } from 'pino'
import { CredentialProvider, ClientOptions } from '../common/interfaces/client'
import { IPaginatedResponse } from '../common/models/paginatedResponse'
import { IClassification } from '../services/classificationManager/classification'
import { IDataSource } from '../services/dataSourceManager/dao/dataSource'

export interface IClassifierClient {
  /**
   * Get paginated list of classifiers
   * @param offset The offset to start from
   * @param count The number of classifiers to return
   * @param dataSource Optional data source to filter by
   */
  getClassifiers(offset: number, count: number, dataSource?: IDataSource): Promise<IPaginatedResponse<IClassification>>
  /**
   * Get classifier by id
   * @param id Classifier id
   */
  getClassifier(id: string): Promise<IClassification>
  /**
   * Save classifier
   * @param classifier Classifier to save
   */
  saveClassifier(classifier: IClassification): Promise<IClassification>
  /**
   * Remove classifier by id
   * @param classifierId Classifier id
   */
  removeClassifier(classifierId: string): Promise<void>
}

export class ClassifierClient implements IClassifierClient {
  private readonly logger: Logger | undefined
  private readonly baseUrl: string
  private readonly loggerEnabled
  private readonly credentialProvider: CredentialProvider | undefined

  constructor (options: ClientOptions) {
    this.baseUrl = options.baseUrl
    this.loggerEnabled = options.loggerEnabled === true
    this.credentialProvider = options.credentialProvider

    if (this.loggerEnabled) {
      const createLogger = require('../common/logger/factory')
      const computedConstants = require('../common/computedConstants')
      this.logger = createLogger({
        serviceName: `classifiers-client-${computedConstants.id}`,
        level: 'debug'
      })
    } else {
      this.logger = undefined
    }
  }

  private async getAxiosRequestOptions (): Promise<AxiosRequestConfig|undefined> {
    if (this.credentialProvider) {
      return this.credentialProvider({})
    }
    return Promise.resolve(undefined)
  }

  async getClassifiers (offset: number, count: number, dataSource?: IDataSource): Promise<IPaginatedResponse<IClassification>> {
    if (offset == null || Number.isNaN(offset)) {
      offset = 0
    }
    if (count == null || Number.isNaN(count)) {
      count = 10
    }
    const url = `${this.baseUrl}/classifiers`
    this.logger?.debug(`Fetching classifiers from url: ${url}`)
    const reqOpts = {
      ...(await this.getAxiosRequestOptions()),
      ...{
        params: {
          ...{
            offset,
            limit: count
          },
          ...dataSource
        }
      }
    }
    const response = await axios.get<IPaginatedResponse<IClassification>>(url, reqOpts)
    return response.data
  }

  async getClassifier (id: string): Promise<IClassification> {
    const url = `${this.baseUrl}/classifiers/${id}`
    this.logger?.debug(`Fetching classifier from: ${url}`)
    const response = await axios.get<IClassification>(url, await this.getAxiosRequestOptions())
    return response.data
  }

  async saveClassifier (classifier: IClassification): Promise<IClassification> {
    const url = `${this.baseUrl}/classifiers/${classifier.id}`
    this.logger?.debug(`Saving classifier to: ${url}`)
    const response = await axios.put<IClassification>(url, classifier, await this.getAxiosRequestOptions())
    this.logger?.info(`Classifier saved ${classifier.id}, result = ${JSON.stringify(response.data)}`)
    return response.data
  }

  async removeClassifier (classifierId: string): Promise<void> {
    const url = `${this.baseUrl}/classifiers/${classifierId}`
    this.logger?.debug(`Removing classifier from: ${url}`)
    await axios.delete(url, await this.getAxiosRequestOptions())
  }
}
