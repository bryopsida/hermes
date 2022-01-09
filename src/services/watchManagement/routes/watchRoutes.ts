import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { IQeuryLimit } from '../../../common/interfaces/commonRest'
import { WatchDTO } from '../dto/watch'
import { Watch } from '../dao/watch'

const routeMountPoint = '/api/watch_management/v1'

export default function registerWatchRoutes (fastify: FastifyInstance): void {
  fastify.get<{
        Querystring: IQeuryLimit,
        Reply: Array<WatchDTO>
    }>(`${routeMountPoint}/watches`, async (request, reply) => {
      reply.send(await Watch.findAll(request.query.offset, request.query.limit))
    })

  fastify.get<{
        Reply: WatchDTO,
        Parameters: {
          id: string
        }
      }>(`${routeMountPoint}/watches/:id`, async (request, reply) => {
        const params = request.params as { id: string }
        const watch = await Watch.findById(params.id)
        if (watch == null) {
          reply.statusCode = 404
          return
        }
        reply.send(watch.toDTO())
      })

  fastify.put<{
        Body: WatchDTO,
        Reply: WatchDTO,
        Parameters: {
            id: string
        }
    }>(`${routeMountPoint}/watches/:id`, async (request, reply) => {
      reply.send(await Watch.upsert(Watch.fromDTO(request.body)))
    })

  // TODO: fix this type coercion, its ugly
  fastify.delete<{
        Reply: FastifyReply,
        Parameters: {
            id: string
        }
    }>(`${routeMountPoint}/tasks/:id`, async (request : FastifyRequest, reply: FastifyReply) => {
      const req:FastifyRequest = request
      const params = req.params as {id: string}
      const hasRecord = await Watch.has(params.id)

      if (!hasRecord) {
        reply.send(404)
      } else {
        reply.send(await Watch.delete(params.id))
      }
    })
}
