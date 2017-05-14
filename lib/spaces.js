const _ = require('lodash/fp')
const Promise = require('bluebird')
const contentful = require('contentful-management')

const spacePattern = /^(?:(\w+):)?([a-z0-9]+):([\w-]+)$/

function parseSpaceParam(spaceParam, pattern) {
  const [, parsedName, space, accessToken] = spaceParam.match(pattern)
  const name = parsedName || space
  return {name, space, accessToken}
}

function parseSpaceParams(spaceParams, pattern = spacePattern) {
  return spaceParams.map(spaceParam => parseSpaceParam(spaceParam, pattern))
}

const handleSpaceRejection = space => reason => {
  console.error(reason)
  throw new Error(`Unable to connect to space ${space}.`)
}

function getSpace({accessToken, space} = {}) {
  return contentful.createClient({accessToken}).getSpace(space)
    .catch(handleSpaceRejection(space))
}

function getSpaces(spaceConfigs) {
  return Promise.reduce(spaceConfigs,
    (spaces, spaceConfig) => getSpace(spaceConfig)
      .then(space => _.set(spaceConfig.name, space, spaces)), {})
}

function getContentTypes(spaces) {
  return Promise.reduce(_.keys(spaces), (contentTypes, name) => {
    const space = spaces[name]
    return space.getContentTypes()
      // FIXME: this will break with pagination!
      .then(({items}) => _.set(name, items, contentTypes))
  }, {})
}

function getSpacesFromParams(spaceParams) {
  const spaceConfigs = parseSpaceParams(spaceParams)
  return getSpaces(spaceConfigs)
}

module.exports = {
  spacePattern,
  parseSpaceParams,
  getSpace,
  getSpaces,
  getSpacesFromParams,
  getContentTypes
}
