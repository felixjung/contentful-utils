const log = require('npmlog')
const _ = require('lodash')
const getSpace = require('./../space')
const {
  getTargets, omitFields, deleteFields: delFields, handleContentTypesRejection
} = require('./../content-types')

function deleteFields(options) {
  const {target, fields: fieldIds} = options
  const targetIds = _.concat([], target)

  log.info(`Deleting fields ${fieldIds.join(', ')} from Content Type(s) ${targetIds.join(', ')}.`)

  return getSpace(options)
    .then(space => space.getContentTypes())
    .then(_.partialRight(deleteFieldsFromContentTypes, fieldIds, targetIds, options))
    .catch(handleContentTypesRejection)
}

function deleteFieldsFromContentTypes({items: contentTypes}, fieldIds, targetIds, options = {}) {
  const targets = getTargets(contentTypes, targetIds)
  const deletingFields = _.map(targets, target =>
    deleteFieldsFromContentType(target, fieldIds, options))
  return Promise.all(deletingFields)
}

function deleteFieldsFromContentType(contentType, fieldIds, {force = false}) {
  const promisedTarget = force ?
    omitFields(contentType, fieldIds) :
    Promise.resolve(contentType)
  return promisedTarget.then(contentType => delFields(contentType, fieldIds))
}

module.exports = deleteFields
