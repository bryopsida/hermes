import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { IQeuryLimit } from '../../../common/interfaces/commonRest'
import { IPaginatedResponse } from '../../../common/models/paginatedResponse'
import { IDataSource } from '../../dataSourceManager/dao/dataSource'
import { ClassificationDAO, IClassificationDAO } from '../dao/classification'
import { ClassificationDTO } from '../dto/classification'

export default function classificationManagerRoutes (fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', fastify.auth([
    fastify.verifyCredentials
  ]))

  fastify.get<{
        Querystring: IQeuryLimit & IDataSource,
        Reply: IPaginatedResponse<ClassificationDTO>,
    }>('/classifiers', {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            offset: { type: 'number', default: 0 },
            limit: { type: 'number', default: 10 },
            id: { type: 'string' },
            name: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            type: { type: 'string' },
            uri: { type: 'string' }
          },
          required: ['offset', 'limit']
        }
      }
    }, async (request, reply) => {
      let classifiers : Array<IClassificationDAO>
      let count = 0
      if (request.query.id == null) {
        classifiers = await ClassificationDAO.findAll(options.mongoose, request.query.offset, request.query.limit)
        count = await ClassificationDAO.count(options.mongoose)
      } else {
        classifiers = await ClassificationDAO.getClassificationsMatchedToSource(options.mongoose, request.query, request.query.offset, request.query.limit)
        count = await ClassificationDAO.getCountOfSourcesMatched(options.mongoose, request.query)
      }
      reply.send({
        offset: request.query.offset,
        limit: request.query.limit,
        totalCount: count,
        items: classifiers.map(c => c.toDTO())
      })
    })

  fastify.get<{
      Reply: ClassificationDTO,
      Params: {
        id: string
      }
    }>('/classifiers/:id', async (request, reply) => {
      const params = request.params as { id: string }
      const classification = await ClassificationDAO.findById(options.mongoose, params.id)
      if (classification == null || classification.id == null || classification.id === '') {
        await reply.code(404).send()
      } else {
        await reply.code(200).send(classification.toDTO())
      }
    })

  fastify.put<{
          Body: ClassificationDTO,
          Reply: ClassificationDTO,
          Parameters: {
              id: string
          }
      }>('/classifiers/:id', {
        schema: {
          body: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
              queryExpression: { type: 'string' },
              resultBucketName: { type: 'string' },
              sourceMatcher: { type: 'string' }
            },
            required: ['id', 'name', 'type', 'tags', 'category', 'queryExpression', 'resultBucketName', 'sourceMatcher']
          }
        }
      }, async (request, reply) => {
        try {
          const classification = (await ClassificationDAO.upsert(options.mongoose, ClassificationDAO.fromDTO(request.body as ClassificationDTO))).toDTO()
          reply.send(classification)
        } catch (err) {
          console.error(err)
          reply.code(500)
        }
      })

  fastify.delete<{
          Reply: FastifyReply,
          Parameters: {
              id: string
          }
      }>('/classifiers/:id', async (request : FastifyRequest, reply: FastifyReply) => {
        const req:FastifyRequest = request
        const params = req.params as {id: string}
        const record = await ClassificationDAO.findById(options.mongoose, params.id)
        const hasRecord = record != null && record.id != null && record.id !== ''

        if (!hasRecord) {
          reply.status(404).send()
        } else {
          await ClassificationDAO.delete(options.mongoose, params.id)
          reply.send({
            success: true
          })
        }
      })
  done()
}
