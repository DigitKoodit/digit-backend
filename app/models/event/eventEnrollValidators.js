const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator } = require('../../helpers/validatorHelpers')

const schema = {
  eventId: {
    in: ['params'],
    isInt: true,
    toInt: true
  },
  'values.*': getStringValidator('Valinnat')
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
