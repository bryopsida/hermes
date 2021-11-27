import { FastifyInstance } from "fastify";
import { IQeuryLimit } from "../../../common/interfaces/commonRest";
import { WatchDTO } from "../dto/watch";
import { Watch } from "../dao/watch";

const routeMountPoint = '/api/watch_management/v1';

export default function registerWatchRoutes(fastify: FastifyInstance): void {
    
    fastify.get<{
        Querystring: IQeuryLimit,
        Reply: Array<WatchDTO>
    }>(`${routeMountPoint}/watches`, async (request, reply) => {
        reply.send(await Watch.findAll(request.query.offset, request.query.limit));
    });

    fastify.put<{
        Body: WatchDTO,
        Reply: WatchDTO,
        Parameters: {
            id: string
        }
    }>(`${routeMountPoint}/watches/:id`, async (request, reply) => {
        reply.send(await Watch.upsert(Watch.fromDTO(request.body)));
    });
}