const { checkSchema, oneOf } = require('express-validator/check')
const { getValidator, getBooleanValidator, getIntValidator, getStringValidator, setIsOptional, getArrayValidator } = require('../../helpers/validatorHelpers')

const idSchema = {
  eventId: {
    in: ['params'],
    isInt: true,
    toInt: true
  }
}

const textFieldSchema = {
  'fields.*.isTextarea': setIsOptional(getBooleanValidator('Tekstialuetieto')),
  'fields.*.maxLength': setIsOptional(getIntValidator('Maksimi merkkimäärä', { min: 0 }))
}

const selectableFieldSchema = {
  'fields.*.options': setIsOptional(getArrayValidator('Vaihtoehdot')),
  'fields.*.options.*.name': setIsOptional(getStringValidator('Vaihtoehdon nimi')),
  'fields.*.options.*.label': setIsOptional(getStringValidator('Vaihtoehdon tunniste')),
  // 'fields.*.options.*.isDefault': getBooleanValidator('Vaihtoehdon oletusarvo'),
  'fields.*.options.*.reserveCount': setIsOptional(getIntValidator('Vaihtoehdon kiintiö', { min: 0 }))
}

const schema = {
  name: getStringValidator('Nimi'),
  description: setIsOptional(getStringValidator('Kuvaus')),
  activeUntil: getStringValidator('Lopetuspäivämäärä'),
  reservedUntil: setIsOptional(getStringValidator('Kiintiöiden avautumispäivä')),
  isVisible: getBooleanValidator('Näkyvyys'),
  activeAt: getStringValidator('Aloituspäivämäärä'),
  maxParticipants: getIntValidator('Osallistumismäärä', { min: 1 }),
  reserveCount: setIsOptional(getIntValidator('Varasijat', { min: 0 })),
  fields: getArrayValidator('Kentät'),
  'fields.*.id': getIntValidator('Kentän id'),
  'fields.*.fieldName': getStringValidator('Kentän tyyppinimi'),
  'fields.*.label': getStringValidator('Tunniste'),
  'fields.*.name': getStringValidator('Nimi'),
  // 'fields.*.order': getIntValidator('Järjestys'),
  'fields.*.public': getBooleanValidator('Julkaistu-tieto'),
  'fields.*.required': getBooleanValidator('Pakollinen'),
  'fields.*.type': getStringValidator('Kentän tyyppi'),
  ...textFieldSchema,
  ...selectableFieldSchema
}

const updateSchema = {
  ...schema,
  ...idSchema
}

const validateCreate = () =>
  getValidator([
    checkSchema(schema)
  ])

const validateUpdate = () =>
  getValidator([
    checkSchema(updateSchema)
  ])

module.exports = {
  validateCreate,
  validateUpdate
}
