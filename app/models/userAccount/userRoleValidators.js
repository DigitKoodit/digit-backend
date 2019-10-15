const { checkSchema } = require('express-validator')
const { getValidator, getStringValidator, getIntValidator } = require('../../helpers/validatorHelpers')

const schema = {
  name: getStringValidator('Nimi'),
  accessLevel: getIntValidator('Käyttäjätaso')
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
