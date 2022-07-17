import { IClassification } from '../classification'
import { ClassificationDTO } from '../dto/classification'

export interface IClassificationDAO extends IClassification {
  toDTO (): ClassificationDTO
}
export class ClassificationDAO implements IClassificationDAO {
  readonly id: string
  constructor (props: IClassification) {
    this.id = props.id
  }

  toDTO (): ClassificationDTO {
    return {
      id: this.id
    }
  }

  static findAll (mongoose: any, offset: number, limit: number): Promise<Array<IClassificationDAO>> {
    return Promise.resolve([])
  }

  static count (mongoose: any): Promise<number> {
    return Promise.resolve(0)
  }

  static upsert (mongoose: any, classification: IClassificationDAO): Promise<IClassificationDAO> {
    return Promise.resolve(classification)
  }

  static fromDTO (classification: ClassificationDTO): IClassificationDAO {
    throw new Error('Not implemented')
  }

  static findById (mongoose: any, id: string): Promise<IClassificationDAO> {
    throw new Error('Not implemented')
  }
}
