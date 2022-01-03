import { knex } from 'knex'
import postgresConfigFactory from '../../config/postgresConfig'
import COMPUTED_CONSTANTS from '../../common/computedConstants'

const config = postgresConfigFactory.buildPostgresConfig('dataSourceApi')

const knexInstance = knex({
  client: 'pg',
  searchPath: 'data_sources',
  connection: {
    host: config.host,
    user: config.user,
    port: config.port,
    password: config.password,
    database: config.database,
    application_name: `data-sources-${COMPUTED_CONSTANTS.id}`
  }
})
const migrationPromise = knexInstance.schema.createSchemaIfNotExists('data_sources').then(() => {
  return knexInstance.migrate.latest({
    directory: './build/src/services/dataSources/migrations',
    loadExtensions: ['.js'],
    tableName: 'migrations',
    schemaName: 'data_sources'
  })
}).then(() => {
  return knexInstance
})

export default migrationPromise

export function cleanupKnex () : Promise<void> {
  return knexInstance.destroy()
}
