const yargs = require('yargs')
const log = require('npmlog')
const _ = require('lodash/fp')

const packageFile = require('../package')
const {spacePattern} = require('./spaces')

const opts = yargs
  .version(packageFile.version || 'Version only available on installed package')
  .usage('Usage: $0 <command> [options]')
  .command({
    command: 'copy-fields <fields..>',
    desc: 'Copies <fields> from --source Content Type to --target Content Type(s).',
    builder: yargs => yargs
      .option('spaces', {
        describe: 'Spaces to operate on. Formatted as [name:]space-id:access-token',
        type: 'array',
        demandOption: true
      })
      .option('source', {
        describe: 'Source Content Type ID.',
        type: 'string',
        demand: true
      })
      .option('target', {
        describe: 'Target Content Type ID(s).',
        type: 'array',
        demand: true,
        alias: ['targets']
      })
      .option('publish', {
        describe: 'Publish the Content Type(s) after adding fields.',
        type: 'boolean',
        demand: false
      })
  })
  .command({
    command: 'delete-fields <fields..>',
    desc: 'Deletes <fields> from --target Content Type(s).',
    builder: yargs => yargs
      .option('target', {
        describe: 'Target Content Type ID(s).',
        type: 'array',
        demand: true,
        alias: ['targets']
      })
      .option('force', {
        describe: 'Force deletion of non-omitted fields.',
        type: 'boolean',
        default: false
      })
  })
  .config('config', 'Configuration file with required values')
  .option('spaces', {
    describe: 'Spaces to operate on. Formatted as [name:]space-id:access-token',
    type: 'array',
    demandOption: true
  })
  .option('pre-publish-delay', {
    describe: 'Delay in milliseconds to account for delay after creating entities, due to internal database indexing',
    type: 'number',
    default: 5000
  })
  .option('host', {
    describe: 'Host for the Management API.',
    type: 'string'
  })
  .option('port', {
    describe: 'Port for the Management API.',
    type: 'string'
  })
  .option('insecure', {
    describe: 'If the Management API should use http instead of the default https.',
    type: 'boolean',
    default: false
  })
  .option('proxy-host', {
    describe: 'hostname of the proxy server',
    type: 'string'
  })
  .option('proxy-port', {
    describe: 'port of the proxy server',
    type: 'string'
  })
  .check(argv => {
    if (!argv.proxyHost && !argv.proxyPort) {
      return true
    }
    if (argv.proxyPort && argv.proxyHost) {
      return true
    }
    log.error('--proxy-host and --proxy-port must be both defined')
    return false
  })
  .check(({spaces}) => {
    if (spaces.length === 0) {
      log.error(`
        Please provide at least one space using the --spaces flag. Each
        space should contain an optional name, the space ID, and the
        CMA auth token. The expected format is "[name:]space-id:auth-token".

        See https://www.contentful.com/developers/docs/references/authentication/#the-content-management-api for more information on the CMA.
      `)
      return false
    }

    const spacesAreValid = _.flow(
      _.map(spacePattern.test.bind(spacePattern)),
      _.every
    )(spaces)

    if (!spacesAreValid) {
      log.error(`
        At least one of the spaces was provided in the wrong format.
        Please use the following format:

          [name:]space-id:auth-token
      `)
      return false
    }

    return true
  })
  .global('spaces', 'pre-publish-delay', 'host', 'port',
    'insecure', 'proxy-host', 'proxy-port', 'config')
  .argv

module.exports = opts
