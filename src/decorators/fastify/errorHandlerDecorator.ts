import { FastifyInstance } from 'fastify'

export class ErrorHandlerDecorator {
  static decorate (fastify: FastifyInstance) {
    fastify.setErrorHandler((err, request, reply) => {
      if (err.statusCode === 401) {
        reply.code(401).send({
          was: 'unauthorized'
        })
        return
      }
      reply.send(err)
    })
  }
}
