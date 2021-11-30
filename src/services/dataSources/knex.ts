import {knex} from 'knex';
import COMPUTED_CONSTANTS from '../../common/computedConstants';

const knexInstance = knex({
    client: 'pg',
    searchPath: 'data_sources',
    connection: {
        host: process.env.PG_HOST  || 'localhost',
        user: process.env.PG_USER || 'postgres',
        port: 5432,
        password: process.env.PG_PASSWORD || 'postgres',
        database: 'datasource_watch',
        application_name: `data-sources-${COMPUTED_CONSTANTS.id}`
    }
});
const migrationPromise = knexInstance.schema.createSchemaIfNotExists('data_sources').then(() => {
    return knexInstance.migrate.latest({
        directory: './build/src/services/dataSources/migrations',
        loadExtensions: ['.js'],
        tableName: 'migrations',
        schemaName: 'data_sources'
    });
}).then(() => {
    return knexInstance;
})

export default migrationPromise;

export function cleanupKnex() : Promise<void> {
    return knexInstance.destroy();
}