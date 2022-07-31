import { StartedTestContainer, GenericContainer } from 'testcontainers'
import { Mongoose, connect } from 'mongoose'
import { randomUUID } from 'crypto'
import fastify, { FastifyInstance } from 'fastify'
import { ClassificationService } from '../../src/services/classificationManager/classificationService'
import { ClassifierClient } from '../../src/clients/classifiersClient'
import { AxiosRequestConfig } from 'axios'
import testConfig from '../helpers/testConfiguration'
import fastifyBasicAuth, { FastifyBasicAuthOptions } from '@fastify/basic-auth'
import fastifyAuth from '@fastify/auth'

// uses a mongodb and redis test container, does not mock those services

/* eslint-disable no-undef */
describe('Classification Client', () => {
  let mongoContainer: StartedTestContainer
  let mongoose: Mongoose
  let app: FastifyInstance
  let classifierService: ClassificationService
  let classifierClient: ClassifierClient

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
    app = fastify()

    // create auth methods
    const authOptions : FastifyBasicAuthOptions = {
      authenticate: {
        realm: 'hermes'
      },
      validate: (username, password, req, reply, done) => {
        if (username === testConfig.requestConfig.auth.username && password === testConfig.requestConfig.auth.password) {
          done()
        } else {
          done(new Error('Invalid username or password'))
        }
      }
    }
    // this adds a decoration at basicAuth on the fastify instance,
    // we need to join this to verifyAuth so we can abstract routes from
    // requiring specific auth types
    app.register(fastifyAuth)
    app.register(fastifyBasicAuth, authOptions)
    app.after(() => {
      app.decorate('verifyCredentials', app.basicAuth)
    })

    classifierService = new ClassificationService(app, mongoose.connection)
    await classifierService.start()
    classifierClient = new ClassifierClient({
      baseUrl: 'http://localhost:54321/api/classification_manager/v1',
      credentialProvider: (axiosOptions: AxiosRequestConfig) => {
        axiosOptions.auth = {
          username: testConfig.requestConfig.auth.username,
          password: testConfig.requestConfig.auth.password
        }
        return Promise.resolve(axiosOptions)
      }
    })
    await app.listen({
      port: 54321
    })
  })
  afterAll(async () => {
    await classifierService?.destroy()
    await app?.close()
    await mongoose.connection.close()
    const mongoLogs = await mongoContainer.logs()
    mongoLogs.destroy()
    await mongoContainer?.stop({ timeout: 15000 })
  })
  it('can create a classification', async () => {
    const createdClassification = await classifierClient.saveClassifier({
      id: randomUUID(),
      name: 'test name',
      type: 'test type',
      category: 'test category',
      sourceMatcher: 'create test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    })
    expect(createdClassification.id).toBeDefined()
    expect(createdClassification.name).toBe('test name')
    expect(createdClassification.type).toBe('test type')
    expect(createdClassification.category).toBe('test category')
  })
  it('can get a classification', async () => {
    const createdClassification = await classifierClient.saveClassifier({
      id: randomUUID(),
      name: 'test name',
      type: 'test type',
      category: 'test category',
      sourceMatcher: 'create test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    })
    const fetchedClassification = await classifierClient.getClassifier(createdClassification.id)
    expect(fetchedClassification.id).toBeDefined()
    expect(fetchedClassification.name).toBe('test name')
  })
  it('can update a classification', async () => {
    const createdClassification = await classifierClient.saveClassifier({
      id: randomUUID(),
      name: 'test name',
      type: 'test type',
      category: 'test category',
      sourceMatcher: 'create test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    })
    const fetchedClassification = await classifierClient.getClassifier(createdClassification.id)
    expect(fetchedClassification.id).toBeDefined()
    expect(fetchedClassification.name).toBe('test name')
    createdClassification.name = 'updated name'
    const updatedClassification = await classifierClient.saveClassifier(createdClassification)
    expect(updatedClassification.id).toBeDefined()
    expect(updatedClassification.name).toBe('updated name')
  })
  it('can delete a classification', async () => {
    const createdClassification = await classifierClient.saveClassifier({
      id: randomUUID(),
      name: 'test name',
      type: 'test type',
      category: 'test category',
      sourceMatcher: 'create test, no match',
      queryExpression: 'test',
      resultBucketName: 'test',
      tags: ['test']
    })
    const fetchedClassification = await classifierClient.getClassifier(createdClassification.id)
    expect(fetchedClassification.id).toBeDefined()
    expect(fetchedClassification.name).toBe('test name')
    await classifierClient.removeClassifier(createdClassification.id)
    let errorThrown = false
    try {
      await classifierClient.getClassifier(createdClassification.id)
    } catch (err) {
      errorThrown = true
    }
    expect(errorThrown).toBe(true)
  })
  it('can fetch a page of classifications', async () => {
    for (let i = 0; i < 10; i++) {
      await classifierClient.saveClassifier({
        id: randomUUID(),
        name: 'test name',
        type: 'test type',
        category: 'test category',
        sourceMatcher: 'create test, no match',
        queryExpression: 'test',
        resultBucketName: 'test',
        tags: ['test']
      })
    }
    const classifications = await classifierClient.getClassifiers(0, 5)
    expect(classifications.totalCount).toBeGreaterThanOrEqual(10)
    expect(classifications.items.length).toBe(5)
  })
  it('can fetch a page of classifications for data source', async () => {
    // create two classifiers to match
    const match = randomUUID()
    for (let i = 0; i < 2; i++) {
      await classifierClient.saveClassifier({
        id: randomUUID(),
        name: 'test name',
        type: 'test type',
        category: 'test category',
        sourceMatcher: '',
        queryExpression: match,
        resultBucketName: 'test',
        tags: ['test']
      })
    }
    const filteredResults = await classifierClient.getClassifiers(0, 5, {
      id: match,
      type: randomUUID(),
      tags: [randomUUID(), randomUUID()],
      name: randomUUID(),
      uri: randomUUID()
    })
    expect(filteredResults.totalCount).toBe(2)
    expect(filteredResults.items.length).toBe(2)
  })
})
