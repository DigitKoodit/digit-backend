const { checkSchema } = require('express-validator')
const { getValidator, getStringValidator, getBooleanValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  title: getStringValidator('Otsikko'),
  description: setIsOptional(getStringValidator('Kuvaus')),
  isHidden: getBooleanValidator('Piilotettu'),
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
