#! /usr/bin/env node
import { Command } from 'commander'
import { DataSourceClient } from '../../../clients/dataSourcesClient'
import { DataSourceCommand } from './commands/dataSources'
import { EnvironmentCommand } from './commands/environment'
import { ConfigurationManager } from './utils/config'
import { randomUUID } from 'crypto'
import { DataSourceDTO } from '../../../services/dataSourceManager/dto/dataSource'
import fs from 'fs/promises'

const configurationManager = new ConfigurationManager()
const environmentCommand = new EnvironmentCommand(configurationManager)

const program = new Command()
program
  .name('pandora')
  .description('A tool to manage hermes')

async function buildDataSourceCommandObj (): Promise<DataSourceCommand> {
  const env = await configurationManager.getCurrentContext()
  const context = await configurationManager.getContext(env)
  if (!context) {
    console.error('Failed to get context for current environment')
    process.exit(1)
  }
  const dataSourceClient = new DataSourceClient({
    baseUrl: `${context.baseUrl}/api/data_source_manager/v1`,
    loggerEnabled: false,
    credentialProvider: async (options) => {
      if (context.auth) {
        console.log('adding auth')
        const username = await fs.readFile(context.auth.usernameFilePath, 'utf8')
        const password = await fs.readFile(context.auth.passwordFilePath, 'utf8')
        options.auth = {
          username,
          password
        }
      }
      console.log('returning options')
      return Promise.resolve(options)
    }
  })
  return new DataSourceCommand(dataSourceClient)
}

function buildEnvironmentCommand (): Command {
  const cmd = new Command('environment')
  cmd
    .command('set')
    .description('Set the current environment')
    .argument('<environment>', 'The environment to set as current')
    .action(async (environment) => {
      await environmentCommand.setEnvironment(environment)
    })

  cmd
    .command('get')
    .description('Get the current environment')
    .action(async () => {
      const env = await environmentCommand.getCurrentEnvironment()
      console.log(`Current environment: ${env}`)
      const currentContext = await environmentCommand.getContext(env)
      console.log(`Current context: ${JSON.stringify(currentContext)}`)
    })
  return cmd
}

function buildDataSourcesCommand (): Command {
  const cmd = new Command('data-sources')

  cmd
    .command('list')
    .description('List all data sources')
    .action(async () => {
      const dataSourceCommand = await buildDataSourceCommandObj()
      await dataSourceCommand.getDataSources(process.stdout)
    })
  cmd
    .command('add')
    .description('Add a data source')
    .argument('<name>', 'The name of the data source')
    .argument('<type>', 'The type of the data source')
    .argument('<url>', 'The url of the data source')
    .action(async (name, type, url) => {
      const dataSourceCommand = await buildDataSourceCommandObj()
      const dataSource : DataSourceDTO = {
        type,
        uri: url,
        id: randomUUID(),
        name,
        tags: []
      }
      await dataSourceCommand.addDataSource(process.stdout, dataSource)
      console.log(`Succesfully added data source: ${name}`)
    })
  cmd
    .command('remove')
    .description('Remove a data source')
    .argument('<id>', 'The id of the data source')
    .action(async (id) => {
      const dataSourceCommand = await buildDataSourceCommandObj()
      await dataSourceCommand.removeDataSource(id)
      console.log('Successfully removed data source: ' + id)
    })
  cmd
    .command('update')
    .description('Update a data source')
    .argument('<id>', 'The id of the data source to update')
    .argument('<name>', 'The name of the data source')
    .argument('<type>', 'The type of the data source')
    .argument('<url>', 'The url of the data source')
    .action(async (name, type, url) => {
      // TODO add
    })

  return cmd
}

program
  .addCommand(buildEnvironmentCommand())
  .addCommand(buildDataSourcesCommand())

program.parse()
