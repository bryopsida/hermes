import { knex } from 'knex'
import configFactory from '../../config/postgresConfig'
import COMPUTED_CONSTANTS from '../../common/computedConstants'

const config = configFactory.buildPostgresConfig('watchManagementApi')

const knexInstance = knex({
  client: 'pg',
  searchPath: 'watches',
  connection: {
    host: config.host,
    user: config.user,
    port: config.port,
    password: config.password,
    database: config.database,
    application_name: `watch-management-${COMPUTED_CONSTANTS.id}`
  }
})
const migrationPromise = knexInstance.schema.createSchemaIfNotExists('watches').then(() => {
  return knexInstance.migrate.latest({
    directory: './build/src/services/watchManagement/migrations',
    loadExtensions: ['.js'],
    tableName: 'migrations',
    schemaName: 'watches'
  })
}).then(() => {
  return knexInstance
})

export default migrationPromise

export function cleanupKnex () : Promise<void> {
  return knexInstance.destroy()
}
