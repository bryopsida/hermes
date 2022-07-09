import { IUsableClosable } from '../common/using'
export interface IRegistry<T extends IUsableClosable> {
  get (id: string): Promise<T>
  closeAll (): Promise<void>
}

export abstract class BaseRegistry<T extends IUsableClosable> implements IRegistry<T> {
  private readonly registry: Map<string, Promise<T>> = new Map()

  BaseRegistry () {
    process.on('exit', this.shutdown.bind(this))
  }

  async closeAll (): Promise<void> {
    await Promise.all(Array.from(this.registry.values()).map(async (resource: Promise<T>) => {
      await (await resource).close()
    }))
  }

  async get (id: string): Promise<T> {
    // if not present build and set, otherwise return existing
    if (!this.registry.has(id)) {
      this.registry.set(id, this.build(id))
    }
    const result: T = (await this.registry.get(id)) as T
    return result
  }

  async set (id: string, val: T): Promise<T> {
    if (this.registry.has(id)) {
      this.registry.set(id, (this.registry.get(id) as Promise<T>)
        .then((existing: T) => existing.close())
        .then(() => val))
    } else {
      this.registry.set(id, Promise.resolve(val))
    }
    return this.registry.get(id) as Promise<T>
  }

  protected async shutdown (): Promise<void> {
    const promises: Promise<void>[] = Array.from(this.registry.values()).map(async (resource: Promise<T>) => {
      await (await resource).close()
    })
    await Promise.all(promises)
  }

  abstract build (id: string): Promise<T>
}
