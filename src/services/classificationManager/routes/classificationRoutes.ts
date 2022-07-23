import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { IQeuryLimit } from '../../../common/interfaces/commonRest'
import { IPaginatedResponse } from '../../../common/models/paginatedResponse'
import { ClassificationDAO, IClassificationDAO } from '../dao/classification'
import { ClassificationDTO } from '../dto/classification'

export default function classificationManagerRoutes (fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', fastify.auth([
    fastify.verifyCredentials
  ]))

  fastify.get<{
        Querystring: IQeuryLimit,
        Reply: IPaginatedResponse<ClassificationDTO>
    }>('/classifiers', async (request, reply) => {
      const classifiers: Array<IClassificationDAO> = await ClassificationDAO.findAll(options.mongoose, request.query.offset, request.query.limit)
      const count = await ClassificationDAO.count(options.mongoose)
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
      }>('/classifiers/:id', async (request, reply) => {
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
          reply.send({
            success: true,
            source: record.toDTO()
          })
        }
      })
  done()
}
