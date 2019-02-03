const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator, getBooleanValidator } = require('../../helpers/validatorHelpers')

const schema = {
  title: getStringValidator('Otsikko'),
  description: getStringValidator('Kuvaus'),
  published: getBooleanValidator('Julkaistu'),
  content: getStringValidator('Sisältö')
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
