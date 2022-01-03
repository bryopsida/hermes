import configFactory from '../../config/postgresConfig'
const config = configFactory.buildPostgresConfig('dataSourcesApi')

module.exports = {
  development: {
    client: 'pg',
    searchPath: ['data_sources'],
    connection: config
  },
  production: {
    client: 'pg',
    searchPath: ['data_sources'],
    connection: config
  }
}
