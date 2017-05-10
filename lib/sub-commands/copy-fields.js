const log = require('npmlog')
const _ = require('lodash')
const getSpace = require('./../space')
const {
  addFields, getFields, getSource, getTargets, handleContentTypesRejection
} = require('./../content-types')

function copyFields(options) {
  const {source: sourceId, target, fields: fieldIds = []} = options
  const targetIds = _.concat([], target)
  const uniqueFieldIds = _.uniq(fieldIds)

  log.info(`Copying fields ${fieldIds.join(', ')} from Content Type ${sourceId} to Content Types ${targetIds.join(', ')}`)

  return getSpace(options)
    .then(space => space.getContentTypes())
    .then(_.partialRight(copyFieldsToTargets, sourceId, uniqueFieldIds, targetIds, options))
    .catch(handleContentTypesRejection)
}

function copyFieldsToTargets({items: contentTypes}, sourceId, fieldIds, targetIds, options) { // eslint-disable-line max-params
  const targets = getTargets(contentTypes, targetIds)
  const source = getSource(contentTypes, sourceId)
  const fields = getFields(source, fieldIds)

  if (!fields) {
    throw new Error(`Could not find Field ${fieldIds} in source Content Type ${sourceId}`)
  }

  return _.forEach(targets, target => addFields(target, fields, options))
}

module.exports = copyFields
