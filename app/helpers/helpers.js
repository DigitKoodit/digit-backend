const moment = require('moment')
const mapValues = require('lodash/mapValues')
const mapKeys = require('lodash/mapKeys')
const isObject = require('lodash/isObject')
const { BadRequest } = require('http-errors')
const { isInt, toInt } = require('validator')

const { MAX_ID_INTEGER } = require('../constants')

// TODO: deep level casifying
const snakeToCamelCaseObject = object => mapValues(mapKeys(object, camelCasifyKey), subCasify)

const camelCasifyKey = (value, key) => key.toLowerCase().trim().split('_').reduce((key, word, index) =>
  key + (index === 0 ? word : capitalize(word)), '')
const subCasify = value => isObject(value) ? snakeToCamelCaseObject(value) : nullify(value)

const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

const nullify = value => typeof value === 'string' && value.length === 0 ? null : value

const logBody = (msg = '') => (req, res, next) => {
  console.log(msg, JSON.stringify(req.body, null, 4)) // eslint-disable-line
  next()
}

// Overrides previous resultRows. Currently not needed anyways but might cause trouble later
const findByIdToResultRow = (modelName, idField, findByIdAction) => (req, _, next, value) => {
  if(!isInt(req.params[idField], { min: 1, max: MAX_ID_INTEGER })) {
    throw new BadRequest(`${modelName} id must be integer`)
  }
  return findByIdAction(req.db, toInt(value))
    .then(resultRow => {
      if(req.resultRow) {
        req.resultRowParent = req.resultRow
      }
      req.resultRow = resultRow
      return next()
    })
}

const partition = (arr, fn) =>
  arr.reduce(
    (acc, val, i, arr) => {
      acc[fn(val, i, arr) ? 0 : 1].push(val)
      return acc
    },
    [[], []])

const sortByProperty = property => (a, b) => a[property] < b[property] ? -1 : Number(a[property] > b[property])
const sortById = sortByProperty('id')
const sortByCreatedAt = (a, b) =>
  a.createdAt === b.createdAt
    ? 0
    : moment(a.createdAt).isBefore(b.createdAt)
      ? -1
      : 1

const updateArrayWithOverrides = (array, overrides) => array.map((item, index) => ({
  ...item,
  ...(overrides[index] || {})
}))

module.exports = {
  snakeToCamelCaseObject,
  camelCasifyKey,
  subCasify,
  capitalize,
  nullify,
  logBody,
  findByIdToResultRow,
  partition,
  sortByProperty,
  sortById,
  sortByCreatedAt,
  updateArrayWithOverrides
}
