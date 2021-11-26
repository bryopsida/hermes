// runs all of the components in one node process with clustering to spread across cores, not ideal but decent for testing
// for production use components will be deployed in k8s via helm chart as individuall containers
import {fastify} from 'fastify';
import cluster from 'cluster';
import {cpus} from 'os';
import { DataSourceService } from './services/dataSources/dataSourceService';
import createLogger from './common/logger/factory';


const cpuCount = cpus().length;

if (cluster.isPrimary) {
    const logger = createLogger({
        serviceName: 'primary-runner', 
        level: 'debug'
    });

    logger.info('Detected Primary Node, forking workers');
    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        logger.info(`worker ${worker.process.pid} died, code ${code}, signal ${signal}`);
    });
    cluster.on('error', (err) => {
        logger.error('worker error: ', err);
    })
} else {
    const logger = createLogger({
        serviceName: `worker-${process.pid}-runner`, 
        level: 'debug'
    });
    logger.info('Worker node, spinning up http server');

    // create fastify instance
    const app = fastify({
        logger: createLogger({
            serviceName: `worker-${process.pid}-fastify`,
            level: 'debug'
        })
    });

    const services = [
        new DataSourceService(app)
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
}

