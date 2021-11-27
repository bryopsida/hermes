import { QueueOptions } from "bull";
import { FastifyInstance } from "fastify";
import { IService } from "../../common/interfaces/service";
import registerTaskRoutes from "./routes/taskManagement";

export class TaskManagementService implements IService {
    constructor(private readonly fastify: FastifyInstance,
                private readonly queueOptions: QueueOptions) {
        this.registerRoutes();
    }
    
    private registerRoutes(): void {
        registerTaskRoutes(this.fastify);
    }

    start(): Promise<void> {
        // inspect database state
        // ensure it matches bull configuration for scheduled tasks
        return Promise.resolve();
    }
    
    stop(): Promise<void> {
        return Promise.resolve();
    } 
}