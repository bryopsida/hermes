import { Writable } from 'stream'
import { ClassifierClient } from '../../../../src/clients/classifiersClient'
import { IClassification } from '../../../../src/services/classificationManager/classification'
import { IPaginatedResponse } from '../../../../src/common/models/paginatedResponse'

export class ClassifiersCommand {
  private readonly client: ClassifierClient

  constructor (dataSourceClient: ClassifierClient) {
    this.client = dataSourceClient
  }

  private async printHeaders (stream: Writable) : Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(`${'ID'.padEnd(48)}${'NAME'.padEnd(32)}${'Type'.padEnd(32)}${'Bucket Name'.padEnd(32)}${'Source Matcher'}\n`, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private printClassifier (stream: Writable, classifer: IClassification) : Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(`${classifer.id.padEnd(48)}${classifer.name.padEnd(32)}${classifer.type.padEnd(32)}${classifer.resultBucketName.padEnd(32)}${classifer.sourceMatcher}\n`, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private printClassifierPage (stream: Writable, paginatedResponse : IPaginatedResponse<IClassification>) : Promise<unknown> {
    return Promise.all(paginatedResponse.items?.map((c) => this.printClassifier(stream, c)))
  }

  async getClassifiers (stream: Writable) : Promise<void> {
    let done = false
    let firstWrite = true
    let offset = 0
    const count = 100
    do {
      const response = await this.client.getClassifiers(offset, count)
      if (!response) {
        done = true
        console.error('Failed to get classifiers, empty response')
        process.exit(2)
      }
      if (response.totalCount === 0) {
        done = true
        console.log('No classifiers found')
        continue
      }
      if (firstWrite) {
        firstWrite = false
        await this.printHeaders(stream)
      }
      await this.printClassifierPage(stream, response)
      if (response.items.length !== count) {
        done = true
      } else {
        offset += count
      }
    } while (!done)
  }

  async removeClassifier (id: string) : Promise<void> {
    await this.client.removeClassifier(id)
  }

  async addClassifier (stream: Writable, classifier: IClassification) : Promise<void> {
    const response = await this.client.saveClassifier(classifier)
    await this.printHeaders(stream)
    await this.printClassifier(stream, response)
  }
}
