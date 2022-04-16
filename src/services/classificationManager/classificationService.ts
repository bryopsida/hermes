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
  start (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  stop (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  destroy (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  isAlive (): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  canServeTraffic (): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  servesTraffic (): boolean {
    throw new Error('Method not implemented.')
  }

  ID: string;
}
