const log = require('npmlog')
const _ = require('lodash')
const {getSpacesFromParams, getContentTypes} = require('./../spaces')
const {
  addFields, getFields, getSource, filterContentTypes, handleContentTypesRejection
} = require('./../content-types')

async function copyFields(options) {
  const {source, targets, fields: fieldIds = []} = options
  const targetIds = _.concat([], targets)
  const uniqueFieldIds = _.uniq(fieldIds)

  log.info(`Copying fields ${fieldIds.join(', ')} from Content Type ${source} to Content Types ${targetIds.join(', ')}`)

  const spaces = await getSpacesFromParams(options.spaces)
  try {
    const contentTypes = await getContentTypes(spaces)
    return copyFieldsToTargets(contentTypes, source, targets, uniqueFieldIds, options)
  } catch (err) {
    handleContentTypesRejection(err)
  }
}

function copyFieldsToTargets(contentTypes, sourceSelector, targetSelectors, fieldIds, options) { // eslint-disable-line max-params
  const targets = filterContentTypes(contentTypes, targetSelectors)
  const source = getSource(contentTypes, sourceSelector)
  const fields = getFields(source, fieldIds)

  if (!fields) {
    throw new Error(`Could not find Field ${fieldIds} in source Content Type ${sourceSelector}`)
  }

  return _.forEach(targets, target => addFields(target, fields, options))
}

module.exports = copyFields
