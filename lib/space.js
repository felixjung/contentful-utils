const _ = require('lodash');
const log = require('npmlog');
const contentful = require('contentful-management');

function getSpace({ managementToken: accessToken, space } = {}) {
  return contentful.createClient({ accessToken }).getSpace(space)
    .catch(_.partialRight(handleSpaceRejection, { space }));
}

function handleSpaceRejection(reason, { space = 'unknown' } = {}) {
  log.error(`Unable to connect to space ${space}.`);
  log.error(reason);
  process.exit(1);
}

module.exports = getSpace;
