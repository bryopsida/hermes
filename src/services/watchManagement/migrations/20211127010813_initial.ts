import { Knex } from 'knex'

exports.up = function (knex: Knex) {
  return knex.schema
    .createTable('watches', function (table) {
      table.increments('id')
      table.string('description', 255).nullable()
      table.string('name', 64).notNullable()
      table.string('graphql', 255).notNullable()
    })
}

exports.down = function (knex: Knex) {
  return knex.schema.dropTable('watches')
}
