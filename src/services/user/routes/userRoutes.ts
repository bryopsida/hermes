import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { IQeuryLimit } from '../../../common/interfaces/commonRest'
import { IPaginatedResponse } from '../../../common/models/paginatedResponse'
import { User } from '../dao/user'
import { UserDTO } from '../dto/user'

const routeMountPoint = '/api/user_manager/v1'

export default function registerUserRoute (fastify: FastifyInstance): void {
  // TODO add authorization rules so only an admin can manage users, all routes admin only except for users fetching their own account individually
  fastify.get<{
        Querystring: IQeuryLimit,
        Reply: IPaginatedResponse<UserDTO>
    }>(`${routeMountPoint}/users`, async (request, reply) => {
      const users = await User.findAll(request.query.offset, request.query.limit)
      const count = await User.count()
      reply.send({
        offset: request.query.offset,
        limit: request.query.limit,
        totalCount: count,
        items: users.map(u => u.toDTO())
      })
    })

  fastify.get<{
    Reply: UserDTO,
    Params: {
      id: string
    }
  }>(`${routeMountPoint}/users/:id`, async (request, reply) => {
    const params = request.params as { id: string }
    const user = await User.findById(params.id)
    if (user == null) {
      reply.statusCode = 404
      return
    }
    reply.send(user.toDTO())
    reply.send()
  })

  fastify.put<{
        Body: UserDTO,
        Reply: UserDTO,
        Parameters: {
            id: string
        }
    }>(`${routeMountPoint}/users/:id`, async (request, reply) => {
      try {
        const user = (await User.upsert(User.fromDTO(request.body))).toDTO()
        reply.send(user)
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
    }>(`${routeMountPoint}/users/:id`, async (request : FastifyRequest, reply: FastifyReply) => {
      const req:FastifyRequest = request
      const params = req.params as {id: string}
      const hasRecord = await User.has(params.id)

      if (!hasRecord) {
        reply.status(404).send()
      } else {
        reply.send(await User.delete(params.id))
      }
    })
}
