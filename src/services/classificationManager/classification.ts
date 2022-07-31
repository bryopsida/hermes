export interface IClassification {
  id: string
  name: string
  type: string
  category: string
  sourceMatcher: string
  queryExpression: string
  resultBucketName: string
  tags: string[]
}
