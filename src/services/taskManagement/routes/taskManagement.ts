import { FastifyInstance } from "fastify";
import { IQeuryLimit } from "../../../common/interfaces/commonRest";
import { TaskDTO } from "../dto/task";

const routeMountPoint = 'api/task_management/v1';

export default function registerTaskRoutes(fastify: FastifyInstance): void {
    
    fastify.get<{
        Querystring: IQeuryLimit,
        Reply: Array<TaskDTO>
    }>(`${routeMountPoint}/tasks`, async (request, reply) => {

    });

    fastify.put<{
        Body: TaskDTO,
        Reply: TaskDTO,
        Parameters: {
            id: string
        }
    }>(`${routeMountPoint}/tasks/:id`, async (request, reply) => {

    });
}