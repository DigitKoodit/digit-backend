const { checkSchema } = require('express-validator/check')
const {
  getValidator,
  getStringValidator,
  getBooleanValidator,
  getEmailValidator,
  setIsOptional
} = require('../../helpers/validatorHelpers')

const schema = {
  username: getStringValidator('Käyttäjätunnus'),
  password: getStringValidator('Salasana'),
  email: getEmailValidator('Sähköposti')
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema({
      ...schema,
      active: setIsOptional(getBooleanValidator('Tila'))
    })
  ])

const validateRegistrationCreate = () =>
  getValidator([
    checkSchema({
      email: getEmailValidator('Sähköposti')
    })
  ])

const validateRegistrationUpdate = () =>
  getValidator([
    checkSchema({
      username: getStringValidator('Käyttäjätunnus'),
      password: getStringValidator('Salasana'),
      email: getEmailValidator('Sähköposti'),
      token: getStringValidator('Varmenne')
    })
  ])

module.exports = {
  validateCreate,
  validateUpdate,
  validateRegistrationCreate,
  validateRegistrationUpdate
}
