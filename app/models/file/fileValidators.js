const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator, getIntValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  name: getStringValidator('Nimi'),
  filename: setIsOptional(getStringValidator('Tiedostonimi')),
  path: getStringValidator('Tiedostopolku'),
  size: setIsOptional(getIntValidator('Tiedostokoko')),
  createdBy: getIntValidator('Luoja'),
  createdAt: getIntValidator('Luomispäivä'),
  description: setIsOptional(getStringValidator('Kuvaus'))
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
