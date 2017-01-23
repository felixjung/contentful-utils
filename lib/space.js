const _ = require('lodash')
const contentful = require('contentful-management')

function getSpace({managementToken: accessToken, space} = {}) {
  return contentful.createClient({accessToken}).getSpace(space)
    .catch(_.partialRight(handleSpaceRejection, {space}))
}

function handleSpaceRejection(reason, {space = 'unknown'} = {}) {
  throw new Error(`Unable to connect to space ${space}.`)
}

module.exports = getSpace
