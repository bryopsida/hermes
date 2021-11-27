import {Knex} from 'knex';

exports.up = function(knex: Knex) {
    return knex.schema
    .createTable('data_sources', function (table) {
       table.increments('id');
       table.string('type', 255).notNullable();
       table.string('name', 255).notNullable();
       table.string('uri', 255).notNullable();
    });
};

exports.down = function(knex: Knex) {
    return knex.schema.dropTable('data_sources')
};
