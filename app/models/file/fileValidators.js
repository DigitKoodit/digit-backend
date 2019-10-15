const { checkSchema } = require('express-validator')
const { getValidator, getStringValidator, getIntValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  filename: setIsOptional(getStringValidator('Tiedostonimi')),
  path: getStringValidator('Tiedostopolku'),
  size: setIsOptional(getIntValidator('Tiedostokoko'))
}

const upadateSchema = {
  description: setIsOptional(getStringValidator('Kuvaus'))
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema({
      ...upadateSchema,
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
