const { checkSchema } = require('express-validator/check')
const { getValidator, getStringValidator, getBooleanValidator, getIntValidator, setIsOptional } = require('../../helpers/validatorHelpers')

const schema = {
  path: getStringValidator('URL'),
  title: getStringValidator('Nimi'),
  isCustom: getBooleanValidator('Komponenttitieto'),
  parentId: setIsOptional(getIntValidator('Parent')),
  sitePageId: setIsOptional(getIntValidator('Sisältötunniste')),
  weight: getIntValidator('Paino'),
  isVisible: getBooleanValidator('Näkyvyys')
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema(schema),
    checkSchema({
      navItemId: {
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
