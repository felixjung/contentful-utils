const _ = require('lodash/fp')
const contentful = require('contentful-management')

function getSpace({managementToken: accessToken, space} = {}) {
  return contentful.createClient({accessToken}).getSpace(space)
    .catch(handleSpaceRejection(space))
}

const handleSpaceRejection = (space) => (reason) => {
  throw new Error(`Unable to connect to space ${space}.`)
}

module.exports = getSpace
