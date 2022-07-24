import mongoose, { Connection, FilterQuery } from 'mongoose'
import { IDataSource } from '../../dataSourceManager/dao/dataSource'
import { IClassification } from '../classification'
import { ClassificationDTO } from '../dto/classification'

const tableName = 'classifications'

export interface IClassificationDAO extends IClassification {
  toDTO (): ClassificationDTO
}

const schema = new mongoose.Schema<IClassificationDAO>({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  sourceMatcher: {
    type: String,
    required: true
  },
  queryExpression: {
    type: String,
    required: true
  },
  resultBucketName: {
    type: String,
    required: true

  },
  tags: {
    type: [String],
    required: false
  }
})
// Add a index on the source matcher, when acting on a dataSource it's metadata is feed in so
// we can lookup all defined classifications we wish to execute on datasource in a paginated way.
schema.index({ sourceMatcher: 'text' })

export class ClassificationDAO implements IClassificationDAO {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly category: string
  readonly queryExpression: string
  readonly sourceMatcher: string
  readonly resultBucketName: string
  readonly tags: string[]
  constructor (props: IClassification | null) {
    if (props != null) {
      this.id = props.id
      this.name = props.name
      this.type = props.type
      this.tags = props.tags
      this.category = props.category
      this.queryExpression = props.queryExpression
      this.resultBucketName = props.resultBucketName
      this.sourceMatcher = props.sourceMatcher
    } else {
      this.id = ''
      this.name = ''
      this.type = ''
      this.tags = []
      this.category = ''
      this.queryExpression = ''
      this.resultBucketName = ''
      this.sourceMatcher = ''
    }
  }

  /**
   * Convert a ClassificationDAO to a ClassificationDTO
   * @returns DTO representation of the classification
   */
  toDTO (): ClassificationDTO {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      category: this.category,
      queryExpression: this.queryExpression,
      resultBucketName: this.resultBucketName,
      tags: this.tags,
      sourceMatcher: this.sourceMatcher
    }
  }

  /**
   * Get the mongoose model for classications
   * @param conn Connection to mongodb
   * @returns Hyrdrate a ClassificationDAO from a mongoose connection
   */
  private static getModel (conn: Connection): mongoose.Model<IClassificationDAO> {
    return conn.model(tableName, schema)
  }

  /**
   * Retrieve paginated classifications
   * @param conn A connected mongoose instance
   * @param offset The offset to start the query at
   * @param limit The number of classifications to return
   * @returns Promise that resolves with an array of classifications
   */
  static async findAll (conn: Connection, offset: number, limit: number): Promise<Array<IClassificationDAO>> {
    if (offset == null || isNaN(offset)) {
      offset = 0
    }
    if (limit == null || isNaN(limit)) {
      limit = 10
    }
    return (await this.getModel(conn).find().skip(offset).limit(limit).exec()).map(doc => new ClassificationDAO(doc))
  }

  /**
   * Count the total number of classications in the system
   * @param conn Connected mongoose instance
   * @returns Promise that resolves with the number of classifications in the database
   */
  static async count (conn: Connection): Promise<number> {
    return this.getModel(conn).countDocuments()
  }

  /**
   * Update or insert a classification
   * @param conn Connected mongoose instance
   * @param classification Classification object to update
   * @returns Promise that resolves with the updated classification from mongodb
   */
  static async upsert (conn: Connection, classification: IClassificationDAO): Promise<IClassificationDAO> {
    const model = this.getModel(conn)
    await model.updateOne({ id: classification.id }, classification, { upsert: true }).exec()
    return new ClassificationDAO(await model.findOne({
      id: classification.id
    }).exec())
  }

  /**
   * Mapper function to convert a DTO to DAO
   * @param classification convert a ClassificationDTO to a ClassificationDAO
   */
  static fromDTO (classification: ClassificationDTO): IClassificationDAO {
    return new ClassificationDAO(classification)
  }

  /**
   * Retrieve a specific classification by id
   * @param conn connected mongoose instance
   * @param id unique classification id, expected to be a UUIDv4
   */
  static async findById (conn: Connection, id: string): Promise<IClassificationDAO> {
    return new ClassificationDAO(await this.getModel(conn).findOne({ id }).exec())
  }

  /**
   * Check if a classification exists
   * @param conn connected mongoose instance
   * @param id id of the classification to check
   * @returns Promise that resolves with true if the classification exists, false otherwise
   */
  static async has (conn: Connection, id: string): Promise<boolean> {
    return (await this.getModel(conn).findOne({ id }).exec()) !== null
  }

  /**
   * Delete a classifcation by id
   * @param conn connected mongoose instance
   * @param id id of the classification to delete
   */
  static async delete (conn: Connection, id: string): Promise<void> {
    await this.getModel(conn).deleteOne({ id }).exec()
  }

  private static buildRegexDataSourceMatchQuery (dataSource: IDataSource) : FilterQuery<IClassificationDAO> {
    return {
      $expr: {
        $regexMatch: {
          input: ['id', dataSource.id, 'name', dataSource.name, 'type', dataSource.type, 'tags', dataSource.tags?.join(','), 'uri', dataSource.uri].join('\n'),
          regex: '$sourceMatcher'
        }
      }
    }
  }

  static async getClassificationsMatchedToSource (conn: Connection, dataSource: IDataSource, offset: number, limit: number): Promise<Array<IClassificationDAO>> {
    return (await this.getModel(conn).find(ClassificationDAO.buildRegexDataSourceMatchQuery(dataSource)).skip(offset).limit(limit).exec()).map(doc => new ClassificationDAO(doc))
  }

  static async getCountOfSourcesMatched (conn: Connection, dataSource: IDataSource): Promise<number> {
    return this.getModel(conn).countDocuments(ClassificationDAO.buildRegexDataSourceMatchQuery(dataSource))
  }
}
