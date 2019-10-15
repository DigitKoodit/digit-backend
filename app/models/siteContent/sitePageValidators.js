const { checkSchema } = require('express-validator')
const { getValidator, getStringValidator, getBooleanValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  title: getStringValidator('Otsikko'),
  description: setIsOptional(getStringValidator('Kuvaus')),
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
