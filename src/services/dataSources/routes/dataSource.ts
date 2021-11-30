import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IQeuryLimit } from "../../../common/interfaces/commonRest";
import { DataSource } from "../dao/dataSource";
import { DataSourceDTO } from "../dto/dataSource";

const routeMountPoint = '/api/data_sources/v1';

export default function registerDataSourceRoute(fastify: FastifyInstance): void {
    
    fastify.get<{
        Querystring: IQeuryLimit,
        Reply: Array<DataSourceDTO>
    }>(`${routeMountPoint}/sources`, async (request, reply) => {
        const dataSource = await DataSource.findAll(request.query.offset, request.query.limit);
        reply.send(dataSource);
    });

    fastify.put<{
        Body: DataSourceDTO,
        Reply: DataSourceDTO,
        Parameters: {
            id: number
        }
    }>(`${routeMountPoint}/sources/:id`, async (request, reply) => {
        const dataSource = await DataSource.upsert(DataSource.fromDTO(request.body));
        reply.send(dataSource);
    });

        //TODO: fix this type coercion, its ugly
    fastify.delete<{
        Reply: FastifyReply,
        Parameters: {
            id: number
        }
    }>(`${routeMountPoint}/sources/:id`, async (request : FastifyRequest, reply: FastifyReply) => {
        const req:FastifyRequest = request;
        const params = req.params as {id: number};
        const hasRecord = await DataSource.has(params.id);
        
        if(!hasRecord) {
            reply.status(404).send();
        } else {
            reply.send(await DataSource.delete(params.id));
        }
    });
}