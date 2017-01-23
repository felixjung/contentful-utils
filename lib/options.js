const yargs = require('yargs');
const log = require('npmlog');
const packageFile = require('../package');

const opts = yargs
  .version(packageFile.version || 'Version only available on installed package')
  .usage('Usage: $0 <command> [options]')
  .command({
    command: 'copy-fields <fields..>', // eslint-disable-line max-len
    desc: 'Copies <fields> from --source Content Type to --target Content Type(s).',
    builder: yargs => yargs
      .option('source', {
        describe: 'Source Content Type ID.',
        type: 'string',
        demand: true
      })
      .option('target', {
        describe: 'Target Content Type ID(s).',
        type: 'array',
        demand: true
      })
      .option('publish', {
        describe: 'Publish the Content Type(s) after adding fields.',
        type: 'boolean',
        demand: false
      })
  })
  .command({
    command: 'delete-fields <fields..>', // eslint-disable-line max-len
    desc: 'Deletes <fields> from --target Content Type(s).',
    builder: yargs => yargs
      .option('target', {
        describe: 'Target Content Type ID(s).',
        type: 'array',
        demand: true
      })
      .option('force', {
        describe: 'Force deletion of non-omitted fields.',
        type: 'boolean',
        default: false
      })
  })
  .config('config', 'Configuration file with required values')
  .option('space', {
    describe: 'ID of the Space to operate on.',
    type: 'string',
    demand: true
  })
  .option('management-token', {
    describe: 'Management API token for the space.',
    type: 'string',
    demand: true
  })
  .option('pre-publish-delay', {
    describe: 'Delay in milliseconds to account for delay after creating entities, due to internal database indexing', // eslint-disable-line max-len
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
    describe: 'If the Management API should use http instead of the default https.', // eslint-disable-line max-len
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
  .check((argv) => {
    if (!argv.proxyHost && !argv.proxyPort) { return true; }
    if (argv.proxyPort && argv.proxyHost) { return true; }
    log.error('--proxy-host and --proxy-port must be both defined');
    return false;
  })
  .check((argv) => {
    if (argv.managementToken) { return true; }
    /* eslint-disable max-len */
    log.error(`
      Please provide a --management-token to be used for the space
      spaces.

      See https://www.contentful.com/developers/docs/references/authentication/#the-content-management-api for more information.
    `);
    /* eslint-enable max-len */
    return false;
  })
  .global('space', 'management-token', 'pre-publish-delay', 'host', 'port',
    'insecure', 'proxy-host', 'proxy-port', 'config')
  .argv;

module.exports = opts;
