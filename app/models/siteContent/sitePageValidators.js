const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator } = require('../../helpers/validatorHelpers')

const schema = {
  title: getStringValidator('Otsikko'),
  description: getStringValidator('Kuvaus'),
  published: getStringValidator('Julkaistu'),
  content: getStringValidator('Sisältö')
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  validateCreate()

module.exports = {
  validateCreate,
  validateUpdate
}
