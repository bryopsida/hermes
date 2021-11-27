import {knex} from 'knex';

const knexInstance = knex({
    client: 'pg',
    searchPath: 'watches',
    connection: {
        host: process.env.PG_HOST  || 'localhost',
        user: process.env.PG_USER || 'postgres',
        port: 5432,
        password: process.env.PG_PASSWORD || 'postgres',
        database: 'datasource_watch'
    },
    migrations: {
        tableName: 'migrations',
        directory: './build/src/services/watchManagement/migrations',
        loadExtensions: ['.js']
    }
});
const migrationPromise = knexInstance.migrate.latest().then(() => {
    return knexInstance;
});

export default migrationPromise;