import configFactory from '../../config/postgresConfig'
const config = configFactory.buildPostgresConfig('watchManagementApi')

module.exports = {
  development: {
    client: 'pg',
    searchPath: ['watches'],
    connection: config
  },
  production: {
    client: 'pg',
    searchPath: ['watches'],
    connection: config
  }
}
