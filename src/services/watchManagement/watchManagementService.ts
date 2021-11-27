import { FastifyInstance } from "fastify";
import { IService } from "../../common/interfaces/service";
import registerWatchRoutes from "./routes/watchRoutes";

export class WatchManagementService implements IService {

    constructor(private readonly fastify: FastifyInstance) {
        // register routes
        registerWatchRoutes(fastify);
    }
    start(): Promise<void> {
        // on startup restore scheduled tasks
        return Promise.resolve();
    }
    stop(): Promise<void> {
        // cannot remove routes from fastify as of yet, also wouldn't be appropriate to stop the server instance.
        // could set a flag to 404 on all routes and remove it if started again.
        return Promise.resolve();
    }
}