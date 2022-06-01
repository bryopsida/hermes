import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { IQeuryLimit } from '../../../common/interfaces/commonRest'
import { IPaginatedResponse } from '../../../common/models/paginatedResponse'
import { DataSource } from '../dao/dataSource'
import { DataSourceDTO } from '../dto/dataSource'

export default function dataSourceRoutes (fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
  try {
    fastify.addHook('preHandler', fastify.auth([
      fastify.verifyCredentials
    ]))

    fastify.get<{
          Querystring: IQeuryLimit,
          Reply: IPaginatedResponse<DataSourceDTO>
      }>('/sources', async (request, reply) => {
        const dataSource = await DataSource.findAll(request.query.offset, request.query.limit)
        const count = await DataSource.count()
        reply.send({
          offset: request.query.offset,
          limit: request.query.limit,
          totalCount: count,
          items: dataSource.map(d => d.toDTO())
        })
      })

    fastify.get<{
      Reply: DataSourceDTO,
      Params: {
        id: string
      }
    }>('/sources/:id', async (request, reply) => {
      const params = request.params as { id: string }
      const dataSource = await DataSource.findById(params.id)
      if (dataSource == null) {
        await reply.code(404).send()
      } else {
        await reply.code(200).send(dataSource.toDTO())
      }
    })

    fastify.put<{
          Body: DataSourceDTO,
          Reply: DataSourceDTO,
          Parameters: {
              id: string
          }
      }>('/sources/:id', async (request, reply) => {
        try {
          const dataSource = (await DataSource.upsert(DataSource.fromDTO(request.body))).toDTO()
          reply.send(dataSource)
        } catch (err) {
          console.error(err)
          reply.code(500)
        }
      })

    // TODO: fix this type coercion, its ugly
    fastify.delete<{
          Reply: FastifyReply,
          Parameters: {
              id: string
          }
      }>('/sources/:id', async (request : FastifyRequest, reply: FastifyReply) => {
        const req:FastifyRequest = request
        const params = req.params as {id: string}
        const hasRecord = await DataSource.has(params.id)

        if (!hasRecord) {
          reply.status(404).send()
        } else {
          reply.send(await DataSource.delete(params.id))
        }
      })
  } catch (err) {
    done(err)
  }
  done()
}
