import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { IQeuryLimit } from '../../../common/interfaces/commonRest'
import { WatchDTO } from '../dto/watch'
import { Watch } from '../dao/watch'
import { IPaginatedResponse } from '../../../common/models/paginatedResponse'

export default function watchRoutes (fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
  try {
    fastify.addHook('preHandler', fastify.auth([
      fastify.verifyCredentials
    ]))

    fastify.get<{
      Querystring: IQeuryLimit,
      Reply: IPaginatedResponse<WatchDTO>
    }>('/watches', async (request, reply) => {
      const totalCount = await Watch.count()
      const items = (await Watch.findAll(request.query.offset, request.query.limit)).map(w => w.toDTO())
      reply.send({
        totalCount,
        items,
        offset: request.query.offset,
        limit: request.query.limit
      })
    })

    fastify.get<{
      Reply: WatchDTO,
      Parameters: {
        id: string
      }
    }>('/watches/:id', async (request, reply) => {
      const params = request.params as { id: string }
      if (!await Watch.has(params.id)) {
        reply.code(404).send()
        return
      }
      const watch = await Watch.findById(params.id)
      reply.send(watch.toDTO())
    })

    fastify.put<{
      Body: WatchDTO,
      Reply: WatchDTO,
      Parameters: {
        id: string
      }
    }>('/watches/:id', async (request, reply) => {
      reply.send(await Watch.upsert(Watch.fromDTO(request.body)))
    })

    // TODO: fix this type coercion, its ugly
    fastify.delete<{
      Reply: FastifyReply,
      Parameters: {
        id: string
      }
    }>('/watches/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      const req: FastifyRequest = request
      const params = req.params as { id: string }
      const hasRecord = await Watch.has(params.id)

      if (!hasRecord) {
        reply.send(404)
      } else {
        reply.send(await Watch.delete(params.id))
      }
    })
  } catch (err) {
    done(err)
  }

  done()
}
