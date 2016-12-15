const log = require('npmlog');
const _ = require('lodash');
const getSpace = require('./../space');
const {
  addFields, getFields, getSource, getTargets, handleContentTypesRejection
} = require('./../content-types');

function copyFields(options) {
  const { source: sourceId, target, fields: fieldIds = [] } = options;
  const targetIds = _.concat([], target);

  log.info(`Copying fields ${fieldIds.join(', ')} from Content Type ${sourceId} to Content Types ${targetIds.join(', ')}`); // eslint-disable-line max-len

  return getSpace(options)
    .then(space => space.getContentTypes())
    .then(_.partialRight(copyFieldsToTargets, sourceId, fieldIds, targetIds, options))
    .catch(handleContentTypesRejection);
}

function copyFieldsToTargets({ items: contentTypes }, sourceId, fieldIds, targetIds, options) {
  const targets = getTargets(contentTypes, targetIds)
  const source = getSource(contentTypes, sourceId);
  const fields = getFields(source, fieldIds);

  if (!fields) {
    log.error(`Could not find Field ${fieldIds} in source Content Type ${sourceId}`); // eslint-disable-line max-len
    process.exit(1);
  }

  return _.forEach(targets, target => addFields(target, fields, options));
}

module.exports = copyFields;
