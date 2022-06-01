import { FastifyRequest, FastifyReply } from 'fastify'

export interface IAuthorization {
  authorize (request: FastifyRequest, reply: FastifyReply, done: Function): Promise<boolean>
}
