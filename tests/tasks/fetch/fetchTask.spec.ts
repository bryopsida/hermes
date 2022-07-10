import { Producer } from 'node-rdkafka'
import { FetchTask } from '../../../src/tasks/fetch/fetchTask'
import { It, Mock } from 'moq.ts'
import { Queue } from 'bull'

/* eslint-disable no-undef */
describe('FetchTask', () => {
  it('can process a data source with credentials', async () => {
    const kafka = new Mock<Producer>()
      .setup(k => k.on(It.Is(val => typeof val === 'string'), It.Is(val => typeof val === 'function'))).returns({} as any)
      .setup(k => k.connect()).returns({} as any)
      .setup(k => k.produce('jsonData', null, It.Is(val => typeof val === 'object'))).returns({} as any)
    const bull = new Mock<Queue<any>>()
      .setup(q => q.process).returns(() => Promise.resolve())
      .setup(q => q.add).returns(() => Promise.resolve({} as any))
    const fTask = new FetchTask(bull.object(), kafka.object())
    // send it to httpbin.org
    await fTask.processJob({
      id: 'test',
      timestamp: new Date().getTime(),
      log: () => {},
      queue: {
        name: 'test'
      } as any,
      data: {
        type: 'http',
        name: 'test',
        uri: 'https://httpbin.org/anything',
        properties: {
          method: 'POST'
        }
      }
    } as any)
  })
})
