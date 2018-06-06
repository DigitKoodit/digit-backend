const { checkSchema } = require('express-validator/check')
const {
  getValidator,
  getStringValidator,
  getBooleanValidator,
  getEmailValidator,
  setIsOptional
} = require('../../helpers/validatorHelpers')

const schema = {
  username: getStringValidator('Käyttäjätunnus', 3),
  password: getStringValidator('Salasana'), // TODO: password validation min length etc
  email: getEmailValidator('Sähköposti')
}

const validateLogin = () =>
  getValidator([
    checkSchema(({
      username: getStringValidator('Käyttäjätunnus', 3),
      password: getStringValidator('Salasana') // TODO: password validation
    }))
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
    checkSchema(schema)
  ])

const validateRegistrationUpdate = () =>
  getValidator([
    checkSchema({
      email: getEmailValidator('Sähköposti'),
      registrationToken: getStringValidator('Varmenne')
    })
  ])

module.exports = {
  validateLogin,
  validateUpdate,
  validateRegistrationCreate,
  validateRegistrationUpdate
}
