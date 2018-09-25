const { checkSchema } = require('express-validator/check')
const { getValidator, getBooleanValidator, getIntValidator, getStringValidator, setIsOptional, getArrayValidator } = require('../../helpers/validatorHelpers')

const schema = {
  name: getStringValidator('Nimi'),
  description: setIsOptional(getStringValidator('Kuvaus')),
  fields: getArrayValidator('Kentät'),
  participants: setIsOptional(getArrayValidator('Osallistujat')),
  activeUntil: getStringValidator('Lopetuspäivämäärä'),
  isVisible: getBooleanValidator('Näkyvyys'),
  activeAt: getStringValidator('Aloituspäivämäärä'),
  maxParticipants: getIntValidator('Osallistumismäärä'),
  reserveCount: getIntValidator('Varasijat')
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema(schema),
    checkSchema({
      eventId: {
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
