const log = require('npmlog');
const _ = require('lodash');

function addFields(
  contentType, fields, { force = false, update = true, publish = false } = {}
) {
  const existingFields = _.get(contentType, 'fields', []);
  const updatedFields = _.reduce(fields, (accFields, field) =>
    addField(accFields, field, force), _.concat([], existingFields));

  log.info(`Adding fields ${getFieldNames(fields)} to Content Type ${contentType.name}.`); // eslint-disable-line max-len
  contentType.fields = updatedFields;

  if (update) {
    log.info(`Updating Content Type ${contentType.name} on Contentful.`);
    contentType.update().then(() => {
      log.info(`COMPLETE: Updated Content Type ${contentType.name}`);
    });
  }

  if (publish) {
    log.info(`Publishing Content Type ${contentType.name} to Contentful.`);
    contentType.publish().then(() => {
      log.info(`COMPLETE: Published Content Type ${contentType.name}`);
    });
  }

  return contentType;
}

function getFieldNames(fields) {
  return _.map(fields, field => field.name).join(', ');
}

function addField(fields, field, force = false) {
  const hasField = _.find(fields, f => f.id === field.id);
  const shouldAddField = !hasField || (hasField && force);
  if (!shouldAddField) {
    log.warning(`Field ${field.name} already exists. Use option \'force\' to overwrite.`); // eslint-disable-line max-len
    log.warning('Skipping...');
    return fields;
  }
  return _.concat(fields, field);
}

function getFields(contentType, fieldIds) {
  const fields = _.get(contentType, 'fields', []);
  return _.map(fieldIds, fieldId => _.find(fields, { id: fieldId }));
}

function getSource(contentTypes, id) {
  return _.find(contentTypes,
    contentType => _.get(contentType, 'sys.id') === id);
}

function omitFields(contentType, fieldIds) {
  const existingFields = _.get(contentType, 'fields');
  const mappedFields = _.map(existingFields, field => {
    const shouldOmitField = _.includes(fieldIds, field.id);
    return shouldOmitField ? _.assign({}, field, { omitted: true }) : field;
  });

  const fieldsUnchanged = _.isEqual(existingFields, mappedFields);

  if (fieldsUnchanged) {
    log.warn(`Fields unchanged. Doing nothing...`);
    return Promise.resolve(contentType);
  }

  contentType.fields = mappedFields;

  return contentType.update()
    .then(updatedContentType => updatedContentType.publish());
}

function deleteFields(contentType, fieldIds) {
  log.info(`Deleting fields from ${contentType.name}.`);
  const existingFields = _.get(contentType, 'fields');
  const mappedFields = _.map(existingFields, field => {
    const shouldDelete = _.includes(fieldIds, field.id);
    const canDelete = _.get(field, 'omitted', false);

    if (shouldDelete && !canDelete) {
      log.warn(`Cannot delete field ${field.id}, you must omit it first. Skipping...`); // eslint-disable-line
    }

    return shouldDelete && canDelete ? _.assign({}, field, { deleted: true }) :
      field;
  });

  const fieldsUnchanged = _.isEqual(existingFields, mappedFields);

  if (fieldsUnchanged) {
    log.warn(`Fields unchanged. Doing nothing...`);
    return Promise.resolve(contentType);
  }

  contentType.fields = mappedFields;
  return contentType.update().then(updatedContentType =>
    updatedContentType.publish());
}

function getTargets(contentTypes, targetIds) {
  const targets = _.filter(contentTypes, contentType =>
    _.includes(targetIds, _.get(contentType, 'sys.id')));

  if (_.isEmpty(targets)) {
    log.warn(`Could not find any Content Types matching the target IDs.`)
  }

  return targets;
}

function handleContentTypesRejection(reason) {
  log.error('Unable to get Content Type(s).');
  console.log('\n');
  console.log(reason);
  process.exit(1);
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
};
