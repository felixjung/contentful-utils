const log = require('npmlog');
const _ = require('lodash');
const getSpace = require('./../space');
const {
  getSource, getTargets, omitFields, deleteFields, handleContentTypesRejection,
} = require('./../content-types');

function del(options) {
  const { target, fields: fieldIds, force } = options;
  const targetIds = _.concat([], target);

  log.info(`Deleting fields ${fieldIds.join(', ')} from Content Type(s) ${targetIds.join(', ')}.`); // eslint-disable-line max-len

  return getSpace(options).then(space => space.getContentTypes().then(
    ({ items: contentTypes }) => {
      const targets = getTargets(contentTypes, targetIds);
      return Promise.all(
        _.map(targets, target => {
          const promisedTarget = force ? omitFields(target, fieldIds) :
            Promise.resolve(target);
          return promisedTarget.then(contentType =>
            deleteFields(contentType, fieldIds));
        })
      );
    }).catch(handleContentTypesRejection)
  );
}

module.exports = del;
