const mapValues = require('lodash/mapValues')
const mapKeys = require('lodash/mapKeys')
const isObject = require('lodash/isObject')

// TODO: deep level casifying
export const snakeToCamelCaseObject = object => mapValues(mapKeys(object, camelCasifyKey), subCasify)

const camelCasifyKey = (value, key) => key.toLowerCase().trim().split('_').reduce((key, word, index) =>
  key + (index === 0 ? word : capitalize(word)), '')
const subCasify = value => isObject(value) ? snakeToCamelCaseObject(value) : nullify(value)

export const capitalize = string => string && string[0].toUpperCase() + string.slice(1)

export const nullify = value => typeof value === 'string' && value.length === 0 ? null : value
