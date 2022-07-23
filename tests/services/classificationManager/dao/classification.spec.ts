import { StartedTestContainer, GenericContainer } from 'testcontainers'
import { ClassificationDAO } from '../../../../src/services/classificationManager/dao/classification'
import { IDataSource } from '../../../../src/services/dataSourceManager/dao/dataSource'
import { Mongoose, connect } from 'mongoose'
import { IClassification } from '../../../../src/services/classificationManager/classification'
import { randomUUID } from 'crypto'

// uses a mongodb and redis test container, does not mock those services

/* eslint-disable no-undef */
describe('Classification DAO', () => {
  let mongoContainer: StartedTestContainer
  let mongoose: Mongoose

  beforeAll(async () => {
    mongoContainer = await new GenericContainer('mongo:latest')
      .withEnv('MONGO_INITDB_ROOT_USERNAME', 'mongodb')
      .withEnv('MONGO_INITDB_ROOT_PASSWORD', 'mongodb')
      .withExposedPorts(27017)
      .start()
    mongoose = await connect(`mongodb://${mongoContainer.getHost()}:${mongoContainer.getMappedPort(27017)}/classifications`, {
      user: 'mongodb',
      pass: 'mongodb',
      dbName: 'classifications',
      authSource: 'admin'
    })
  })
  afterAll(async () => {
    await mongoose.connection.close()
    const mongoLogs = await mongoContainer.logs()
    mongoLogs.destroy()
    await mongoContainer?.stop({ timeout: 15000 })
  })
  it('can create a classification', async () => {
    const classification : IClassification = {
      id: randomUUID(),
      name: 'test',
      type: 'test',
      category: 'test',
      sourceMatcher: 'create test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    const dao = await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(classification))
    expect(dao.id).toEqual(classification.id)
    expect(dao.name).toEqual(classification.name)
  })
  it('can update a classification', async () => {
    const classification : IClassification = {
      id: randomUUID(),
      name: 'test',
      type: 'test',
      category: 'test',
      sourceMatcher: 'update test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    const dao = await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(classification))
    expect(dao.id).toEqual(classification.id)
    expect(dao.name).toEqual(classification.name)

    classification.name = 'test2'
    const dao2 = await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(classification))
    expect(dao2.id).toEqual(classification.id)
    expect(dao2.name).toEqual(classification.name)
  })
  it('can delete a classification', async () => {
    const classification : IClassification = {
      id: randomUUID(),
      name: 'test',
      type: 'test',
      category: 'test',
      sourceMatcher: 'delete test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    const dao = await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(classification))
    expect(dao.id).toEqual(classification.id)
    await ClassificationDAO.delete(mongoose.connection, dao.id)
    const hasId = await ClassificationDAO.has(mongoose.connection, dao.id)
    expect(hasId).toBeFalsy()
  })
  it('can get a classification', async () => {
    const classification : IClassification = {
      id: randomUUID(),
      name: 'test',
      type: 'test',
      category: 'test',
      sourceMatcher: 'fetch test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(classification))
    const fetchedDao = await ClassificationDAO.findById(mongoose.connection, classification.id)
    expect(fetchedDao.id).toEqual(classification.id)
  })
  it('can get pages of classifications', async () => {
    const classifications : IClassification[] = []
    for (let i = 0; i < 10; i++) {
      classifications.push({
        id: randomUUID(),
        name: 'test',
        type: 'test',
        category: 'test',
        sourceMatcher: 'pagaination test, no match',
        queryExpression: 'test',
        resultBucketName: 'test',
        tags: ['test']
      })
    }
    await Promise.all(classifications.map(classification => ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(classification))))
    const fetchedDaos = await ClassificationDAO.findAll(mongoose.connection, 0, 5)
    expect(fetchedDaos.length).toEqual(5)
    const fetchedDaos2 = await ClassificationDAO.findAll(mongoose.connection, 5, 5)
    expect(fetchedDaos2.length).toEqual(5)
  })
  it('can lookup pages of classifications matched to a datasource', async () => {
    // create several classifications with regex matches, verify pagination works
    // and only classifications that match are returned, first cut of this will just
    // be basic tests.

    // create a global matcher
    const globalMatcher : IClassification = {
      id: randomUUID(),
      name: 'global',
      type: 'global',
      category: 'test',
      sourceMatcher: '.*',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(globalMatcher))

    const idMatch = randomUUID()
    const idMatcher : IClassification = {
      id: idMatch,
      name: 'id',
      type: 'id',
      category: 'test',
      sourceMatcher: '.*' + idMatch + '.*',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    // create a id matcher
    await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(idMatcher))
    const uriMatcher : IClassification = {
      id: randomUUID(),
      name: 'uri',
      type: 'uri',
      category: 'test',
      sourceMatcher: '.*uri\\n.*google\\.com\\.*',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    }
    await ClassificationDAO.upsert(mongoose.connection, ClassificationDAO.fromDTO(uriMatcher))

    const globalMatchDS : IDataSource = {
      id: randomUUID(),
      name: 'test',
      type: 'test',
      uri: 'http://www.test.com',
      tags: ['test']
    }

    // should only match global
    let matchedClassifications = await ClassificationDAO.getClassificationsMatchedToSource(mongoose.connection, globalMatchDS, 0, 5)
    expect(matchedClassifications.length).toEqual(1)
    expect(matchedClassifications[0].id).toEqual(globalMatcher.id)

    const idMatchDS : IDataSource = {
      id: idMatch,
      name: 'test',
      type: 'test',
      uri: 'http://www.test.com/',
      tags: ['test']
    }

    // should only match global + id
    matchedClassifications = await ClassificationDAO.getClassificationsMatchedToSource(mongoose.connection, idMatchDS, 0, 5)
    expect(matchedClassifications.length).toEqual(2)
    expect(matchedClassifications.map(c => c.id)).toContain(globalMatcher.id)
    expect(matchedClassifications.map(c => c.id)).toContain(idMatcher.id)

    const uriMatchDS : IDataSource = {
      id: randomUUID(),
      name: 'test',
      type: 'test',
      uri: 'http://www.google.com/extra',
      tags: ['test']
    }

    // should only match global + uri
    matchedClassifications = await ClassificationDAO.getClassificationsMatchedToSource(mongoose.connection, uriMatchDS, 0, 5)
    expect(matchedClassifications.length).toEqual(2)
    expect(matchedClassifications.map(c => c.id)).toContain(globalMatcher.id)
    expect(matchedClassifications.map(c => c.id)).toContain(uriMatcher.id)
  })
})
