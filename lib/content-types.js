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

function getSource(contentTypes, id) {
  return _.find(contentTypes,
    contentType => _.get(contentType, 'sys.id') === id)
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

function getTargets(contentTypes, targetIds) {
  const targets = _.filter(contentTypes, contentType =>
    _.includes(targetIds, _.get(contentType, 'sys.id')))

  if (_.isEmpty(targets)) {
    log.warn(`Could not find any Content Types matching the target IDs.`)
  }

  return targets
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
  getTargets,
  handleContentTypesRejection
}
