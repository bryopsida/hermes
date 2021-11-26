import { FastifyInstance } from "fastify";
import { DataSource } from "../dao/dataSource";
import { DataSourceDTO } from "../dto/dataSource";

export interface IQeuryLimit {
    offset: number;
    limit: number;
}

export default function registerDataSourceRoute(fastify: FastifyInstance): void {
    
    fastify.get<{
        Querystring: IQeuryLimit,
        Reply: Array<DataSourceDTO>
    }>('/', async (request, reply) => {
        const dataSource = await DataSource.findAll(request.query.offset, request.query.limit);
        reply.send(dataSource);
    });

    fastify.put<{
        Body: DataSourceDTO,
        Reply: DataSourceDTO
    }>('/:id', async (request, reply) => {
        const dataSource = await DataSource.upsert(DataSource.fromDTO(request.body));
        reply.send(dataSource);
    });
}