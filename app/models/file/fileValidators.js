const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  name: getStringValidator('Nimi'),
  filename: setIsOptional(getStringValidator('Tiedostonimi'))
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema(schema),
    checkSchema({
      fileId: {
        in: ['params'],
        isInt: true,
        toInt: true
      }
    })
  ])

module.exports = {
  validateCreate,
  validateUpdate
}
