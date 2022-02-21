import { FastifyInstance } from 'fastify'
import { IHealthSidekick } from '../../../../common/interfaces/sidekicks/health'

export function registerHealthRoutes (fastify: FastifyInstance, basePath: string, HealthSideKick: IHealthSidekick) : void {
  fastify.get(`${basePath}/alive`, async (request, reply) => {
    const isAlive = await HealthSideKick.isAlive()
    reply.statusCode = isAlive ? 200 : 503
    reply.send({
      alive: isAlive
    })
  })

  fastify.get(`${basePath}/ready`, async (request, reply) => {
    const canServeTraffic = await HealthSideKick.canServeTraffic()
    reply.statusCode = canServeTraffic ? 200 : 503
    reply.send({
      ready: canServeTraffic
    })
  })
}
