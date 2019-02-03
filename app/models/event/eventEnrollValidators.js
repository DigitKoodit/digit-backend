const { checkSchema } = require('express-validator/check')
const isEmpty = require('lodash/isEmpty')
const isObject = require('lodash/isObject')
const { getValidator, getStringValidator } = require('../../helpers/validatorHelpers')


const validateValueField = (value, { req, path }) => {
  const valueKey = path.split('.')[1]
  const eventFields = req.resultRow.fields || req.resultRow.event_data.fields

  const field = eventFields.find(field => field.name === valueKey)
  if(!field) {
    throw new Error('Tuntematon kenttä')
  }
  if(field.required && (value == null || value.length === 0 || isEmpty(value))) {
    throw new Error('vaaditaan')
  }

  const expectTextValue = field.type === 'text'
  const isValidTextValue = expectTextValue && (typeof value === 'string' || typeof value === 'number')
  if(isValidTextValue) {
    return true
  }

  const requireOptionCheck = field.type === 'radio' || field.type === 'select'
  const isValidSelectableOption = requireOptionCheck && field.options.some(fieldOption => fieldOption.name === value)
  if(isValidSelectableOption) {
    return true
  }

  const isValidCheckboxOption = isObject(value) && Object.keys(value).every(optionKey => field.options.some(fieldOption => fieldOption.name === optionKey))
  if(isValidCheckboxOption) {
    return true
  }

  throw new Error('väärän tyyppinen arvo')
}

const schema = {
  eventId: {
    in: ['params'],
    isInt: true,
    toInt: true
  },
  values: {
    custom: {
      options: valueObject => !!valueObject && !isEmpty(valueObject)
    }
  },
  'values.*': {
    custom: {
      options: validateValueField,
    }
  }
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = validateCreate

module.exports = {
  validateCreate,
  validateUpdate
}
