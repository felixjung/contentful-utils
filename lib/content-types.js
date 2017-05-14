const log = require('npmlog')
const _ = require('lodash')
const inquirer = require('inquirer')
const Promise = require('bluebird')

async function addFields(
  contentType, fields, {update = true, publish = false} = {}
) {
  const existingFields = _.get(contentType, 'fields', [])

  try {
    const updatedFields = await Promise.reduce(fields, (accFields, field) =>
      addField(accFields, field), _.concat([], existingFields))

    log.info(`Adding fields ${getFieldNames(fields)} to Content Type ${contentType.name}.`)
    contentType.fields = updatedFields

    if (update) {
      log.info(`Updating Content Type ${contentType.name} on Contentful.`)
      contentType.update().then(() => {
        log.info(`COMPLETE: Updated Content Type ${contentType.name}`)
      })
    }

    if (publish) {
      log.info(`Publishing Content Type ${contentType.name} to Contentful.`)
      contentType.publish().then(() => {
        log.info(`COMPLETE: Published Content Type ${contentType.name}`)
      })
    }
    return contentType
  } catch (err) {
    console.error(err)
  }
}

function getFieldNames(fields) {
  return _.map(fields, field => field.name).join(', ')
}

async function addField(fields, field) {
  const existingField = _.find(fields, {id: field.id})

  if (!existingField) {
    return _.concat(fields, field)
  }

  // Handle the existing field

  try {
    const {overwrite} = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `Field ${field.id} already exists. Overwrite?`
    }])

    if (!overwrite) {
      return fields
    }
  } catch (err) {
    console.error('Inquirer failed')
  }

  // Check if fields are compatible (i.e. Array vs. non-array type field)
  const sameType = existingField.type === field.type

  if (!sameType) {
    return fields
  }

  const isArrayType = field.type === 'Array'
  const incompatibleArrays = isArrayType && field.items.type !== existingField.items.type

  if (incompatibleArrays) {
    return fields
  }

  // Overwrite content type
  const otherFields = _.reject(fields, existingField)
  return _.concat(otherFields, field)
}

function getFields(contentType, fieldIds) {
  const fields = _.get(contentType, 'fields', [])
  return _.map(fieldIds, fieldId => _.find(fields, {id: fieldId}))
}

function omitFields(contentType, fieldIds) {
  const existingFields = _.get(contentType, 'fields')
  const mappedFields = _.map(existingFields, field => {
    const shouldOmitField = _.includes(fieldIds, field.id)
    return shouldOmitField ?
      _.assign({}, field, {omitted: true}) :
      field
  })

  const fieldsUnchanged = _.isEqual(existingFields, mappedFields)

  if (fieldsUnchanged) {
    log.warn(`Fields unchanged. Doing nothing...`)
    return Promise.resolve(contentType)
  }

  contentType.fields = mappedFields

  return contentType.update()
    .then(updatedContentType => updatedContentType.publish())
}

function deleteFields(contentType, fieldIds) {
  log.info(`Deleting fields from ${contentType.name}.`)
  const existingFields = _.get(contentType, 'fields')
  const mappedFields = _.map(existingFields, field => {
    const shouldDelete = _.includes(fieldIds, field.id)
    const canDelete = _.get(field, 'omitted', false)

    if (shouldDelete && !canDelete) {
      log.warn(`Cannot delete field ${field.id}, you must omit it first. Skipping...`)
    }

    return shouldDelete && canDelete ? _.assign({}, field, {deleted: true}) :
      field
  })

  const fieldsUnchanged = _.isEqual(existingFields, mappedFields)

  if (fieldsUnchanged) {
    log.warn(`Fields unchanged. Doing nothing...`)
    return Promise.resolve(contentType)
  }

  contentType.fields = mappedFields
  return contentType.update().then(updatedContentType =>
    updatedContentType.publish())
}

const prefixSelector = _.curry((prefix, selector) => `${prefix}/${selector}`)

function getSource(allContentTypes, selector) {
  const allSources = filterContentTypes(allContentTypes, [selector])
  if (allSources.length > 1) {
    console.error('Potential sources', allSources)
    throw new Error(`Found multiple sources for selector ${selector}.`)
  }
  return _.first(allSources)
}

function filterContentTypes(allContentTypes, selectors) {
  const spaces = Object.keys(allContentTypes)
  const singlePrefix = spaces.length === 1 && spaces[0]
  const prefixedSelectors = singlePrefix ?
    selectors.map(prefixSelector(singlePrefix)) : selectors

  return _.reduce(prefixedSelectors, (acc, selector) => {
    const [space, contentTypeId] = _.split(selector, '/')
    const validSelector = space && contentTypeId

    if (!validSelector) {
      log.error(`Content Type ${selector} does not have the correct format. Please provide it as 'space/content-type-id'.`)
      throw new TypeError(`Invalid format for Content Type ${selector}. See help.`)
    }

    const spaceContentTypes = _.get(allContentTypes, space, [])

    if (_.isEmpty(spaceContentTypes)) {
      log.warn(`Could not find space at ${space}. Did you provide it using the --spaces flag?`)
      return acc
    }

    const contentType = _.find(spaceContentTypes,
      ({sys}) => _.get(sys, 'id') === contentTypeId)

    if (_.isUndefined(contentType)) {
      log.warn(`Could not find Content Type ${contentTypeId} in space ${space}.`)
      return acc
    }

    return _.concat(acc, contentType)
  }, [])
}

function handleContentTypesRejection() {
  throw new Error('Unable to get Content Type(s).')
}

module.exports = {
  getFields,
  addFields,
  addField,
  deleteFields,
  omitFields,
  getSource,
  filterContentTypes,
  handleContentTypesRejection
}
