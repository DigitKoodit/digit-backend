const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  name: getStringValidator('Nimi'),
  link: setIsOptional(getStringValidator('Linkki')),
  logo: getStringValidator('Logo'),
  description: setIsOptional(getStringValidator('Kuvaus')),
  activeAt: getStringValidator('ALoituspäivämäärä'),
  activeUntil: getStringValidator('Lopetuspäivämäärä')
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema(schema),
    checkSchema({
      sponsorId: {
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
