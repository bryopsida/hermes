import {IService} from '../../common/interfaces/service';
import {FastifyInstance} from 'fastify';
import registerDataSourceRoute from './routes/dataSource';
import { cleanupKnex } from './knex';

export class DataSourceService implements IService {
    
    constructor(private readonly fastify: FastifyInstance) {
        this.registerRoutes();
    }
    
    private registerRoutes(): void {
        registerDataSourceRoute(this.fastify);
    }

    start(): Promise<void> {
        return Promise.resolve();
    }
    
    stop(): Promise<void> {
        return Promise.resolve();
    } 
    async destroy(): Promise<void> {
        return cleanupKnex();
    }
    
}