// runs all of the components in one node process with clustering to spread across cores, not ideal but decent for testing
// for production use components will be deployed in k8s via helm chart as individuall containers
import {fastify} from 'fastify';
import cluster, {Worker} from 'cluster';
import {cpus, hostname} from 'os';
import { DataSourceService } from './services/dataSources/dataSourceService';
import createLogger from './common/logger/factory';
import { TaskRunnerService } from './services/taskRunner/taskRunnerService';
import computedConstants from './common/computedConstants';
import { TaskManagementService } from './services/taskManagement/taskManagementService';
import { WatchManagementService } from './services/watchManagement/watchManagementService';

const cpuCount = cpus().length;

if (cluster.isPrimary) {
    const workers: Array<Worker> = [];
    const logger = createLogger({
        serviceName: 'primary-runner', 
        level: 'debug'
    });

    logger.info(`Detected Primary Node, forking workers to create ${cpuCount} workers`);
    for (let i = 0; i < cpuCount; i++) {
        workers.push(cluster.fork());
    }
    
    cluster.on('exit', (worker, code, signal) => {
        logger.info(`worker ${worker.process.pid} died, code ${code}, signal ${signal}`);
    });
    cluster.on('error', (err) => {
        logger.error('worker error: ', err);
    });
} else {

    //TODO: start breaking up into smaller pieces

    const logger = createLogger({
        serviceName: `worker-${computedConstants.id}-runner`, 
        level: 'debug'
    });
    logger.info('Worker node, spinning up http server');

    // create fastify instance
    const app = fastify({
        logger: createLogger({
            serviceName: `worker-${computedConstants.id}-fastify`,
            level: 'debug'
        })
    });

    // define services managed by this mono app entry point
    const services = [
        new DataSourceService(app),
        new TaskRunnerService({
            redis: {
                host: process.env.REDIS_HOST || 'redis',
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
                password: process.env.REDIS_PASSWORD || ''
            }
        }),
        new TaskManagementService(app, {
            redis: {
                host: process.env.REDIS_HOST || 'redis',
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
                password: process.env.REDIS_PASSWORD || ''
            }
        }),
        new WatchManagementService(app)
    ]

    logger.info('Starting sub services');

    const startAllServices = async () => {
        for (const service of services) {
            await service.start();
        }
    };

    startAllServices().then(() => {
        logger.info('Finished creating sub services');
        app.listen(3000);
        logger.info('Application listening on port 3000');
    }).catch((err) => {
        logger.error('Error during application startup', err);
        process.exit(1);
    });

    const stop = async () => {
        logger.info('Received exit signal, stopping services');
        await Promise.all(services.map(service => service.stop()));
    };

    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
}

