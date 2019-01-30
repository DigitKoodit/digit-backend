const { checkSchema } = require('express-validator/check')
const { getValidator, getArrayValidator } = require('../../helpers/validatorHelpers')

const schema = {
  eventId: {
    in: ['params'],
    isInt: true,
    toInt: true
  },
  values: {
    in: ['body']
  }
}

const validateGet = () =>
  getValidator([
    checkSchema({
      eventId: {
        in: ['params'],
        isInt: true,
        toInt: true
      }
    })
  ])

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = validateCreate

module.exports = {
  validateCreate,
  validateUpdate,
  validateGet
}
