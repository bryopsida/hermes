import {Knex} from 'knex';

exports.up = function(knex: Knex) {
    return knex.schema
    .createTable('tasks', function (table) {
        table.increments('id');
        table.string('name', 64).notNullable();
        table.string('cron', 64).notNullable();
        table.string('description', 256).nullable();
        table.jsonb('task_params').nullable();
    });
};

exports.down = function(knex: Knex) {
    return knex.schema.dropTable('tasks')
};