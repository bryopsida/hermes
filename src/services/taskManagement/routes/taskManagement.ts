import { FastifyInstance } from "fastify";
import { IQeuryLimit } from "../../../common/interfaces/commonRest";
import { Task } from "../dao/task";
import { TaskDTO } from "../dto/task";

const routeMountPoint = '/api/task_management/v1';

export default function registerTaskRoutes(fastify: FastifyInstance): void {
    
    fastify.get<{
        Querystring: IQeuryLimit,
        Reply: Array<TaskDTO>
    }>(`${routeMountPoint}/tasks`, async (request, reply) => {
        reply.send(await Task.findAll(request.query.offset, request.query.limit));
    });

    fastify.put<{
        Body: TaskDTO,
        Reply: TaskDTO,
        Parameters: {
            id: string
        }
    }>(`${routeMountPoint}/tasks/:id`, async (request, reply) => {
        reply.send(await Task.upsert(Task.fromDTO(request.body)));
    });
}