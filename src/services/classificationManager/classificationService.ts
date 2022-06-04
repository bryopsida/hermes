import { IService } from '../../common/interfaces/service'

// What does a classifier do?
// It isn't an alert condition, instead it's a query
// that looks at the data and extracts a value or values from it.
// it then updates metadata in the object. So what do you need to define a classifier?
// 1) A name
// 2) Unique ID
// 3) A query
// 4) A query type (graphql)
// 5) A destination path
// 6) A destination type
//

// TODO
export class ClassificationService implements IService {
  public static readonly NAME : string = 'classification_manager'
  private _isAlive: boolean = false

  constructor () {
    this.ID = ClassificationService.NAME
  }

  start (): Promise<void> {
    this._isAlive = true
    return Promise.resolve()
  }

  stop (): Promise<void> {
    this._isAlive = false
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await this.stop()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(this._isAlive)
  }

  canServeTraffic (): Promise<boolean> {
    return this.isAlive()
  }

  servesTraffic (): boolean {
    return true
  }

  ID: string = ClassificationService.NAME
  ORDER: number = 1
}
