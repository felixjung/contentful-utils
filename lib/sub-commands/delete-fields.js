const log = require('npmlog')
const _ = require('lodash')
const Promise = require('bluebird')

const {getSpacesFromParams, getContentTypes} = require('./../spaces')
const {
  omitFields, deleteFields: delFields, handleContentTypesRejection, filterContentTypes
} = require('./../content-types')

async function deleteFields(options) {
  const {targets, fields: fieldIds} = options
  const uniqueFieldIds = _.uniq(fieldIds)
  const targetIds = _.concat([], targets)

  log.info(`Deleting fields ${fieldIds.join(', ')} from Content Type(s) ${targetIds.join(', ')}.`)

  const spaces = await getSpacesFromParams(options.spaces)
  try {
    const contentTypes = await getContentTypes(spaces)
    return await deleteFieldsFromContentTypes(contentTypes, uniqueFieldIds, targetIds, options)
  } catch (err) {
    console.error(err)
    handleContentTypesRejection(err)
  }
}

function deleteFieldsFromContentTypes(allContentTypes, fieldIds, selectors, options = {}) {
  const targets = filterContentTypes(allContentTypes, selectors)
  return Promise.map(targets, target => deleteFieldsFromContentType(target, fieldIds, options))
}

function deleteFieldsFromContentType(contentType, fieldIds, {force = false}) {
  const promisedTarget = force ?
    omitFields(contentType, fieldIds) :
    Promise.resolve(contentType)
  return promisedTarget.then(contentType => delFields(contentType, fieldIds))
}

module.exports = deleteFields
