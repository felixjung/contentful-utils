const log = require('npmlog');
const _ = require('lodash');
const getSpace = require('./../lib/space');
const {
  addFields, getFields, getSource, getTargets, handleContentTypesRejection
} = require('./../lib/content-types');

function copyFields(options) {
  const {
    source: sourceId, target, fields: fieldIds = [], force = false
  } = options;
  const targetIds = _.concat([], target);

  log.info(`Copying fields ${fieldIds.join(', ')} from Content Type ${sourceId} to Content Types ${targetIds.join(', ')}`); // eslint-disable-line max-len

  const gettingSpace = getSpace(options);

  return gettingSpace.then(space => space.getContentTypes().then(
    ({ items: contentTypes }) => {
      const source = getSource(contentTypes, sourceId);
      const targets = getTargets(contentTypes, targetIds);
      const fields = getFields(source, fieldIds);

      if (!fields) {
        log.error(`Could not find Field ${fieldIds} in source Content Type ${sourceId}`); // eslint-disable-line max-len
        process.exit(1);
      }

      return _.forEach(targets, target => addFields(target, fields, {}));
    }).catch(handleContentTypesRejection)
  );
}

module.exports = copyFields;
