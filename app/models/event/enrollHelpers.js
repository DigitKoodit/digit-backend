const moment = require('moment')
const { BadRequest, Forbidden } = require('http-errors')
const { partition, sortById } = require('../../helpers/helpers')

const hasStillLimits = event => event.reservedUntil && moment(event.reservedUntil).isAfter(moment())

const isEnrollPossible = (event, previousEnrollResults) => {
  const { maxParticipants, reserveCount } = event
  if(moment().isBefore(moment(event.activeAt))) {
    throw new Forbidden(`Enrolling hasn't stated yet`)
  } else if(moment().isAfter(moment(event.activeUntil))) {
    throw new Forbidden(`Enrolling has ended`)
  }
  if(maxParticipants != null) {
    const eventParticipantLimit = maxParticipants + reserveCount
    if(previousEnrollResults.length >= eventParticipantLimit) {
      throw new BadRequest('Event is full')
    }
  }
  return true
}

const determineIsSpare = (event, previousEnrolls, enroll) => {
  const { fields, maxParticipants, reserveCount } = event
  const eventParticipantLimit = maxParticipants + reserveCount

  if(previousEnrolls.length >= eventParticipantLimit) {
    throw new BadRequest('Event is full')
  }

  if(!hasStillLimits(event)) {
    return false
  }

  const [spareEnrolls, regularEnrolls] = partition(previousEnrolls, enroll => enroll.isSpare)
  const limitedFields = getLimitedFields(fields)
  if(!hasLimitedFields(fields)) {
    if(regularEnrolls.length < maxParticipants) {
      return false
    }
    return true
  }

  // Collect info about field of this particular enroll
  const newEnrollLimitField = Object.entries(limitedFields)
    .map(([key, value]) => ({
      key,
      value: enroll.values[key],
      reserveCount: value[enroll.values[key]]
    }))
  return newEnrollLimitField.some(limitedField => {
    // const spareLimitedEnrolls = spareEnrolls.filter(enroll =>
    //   enroll.values[limitedField.key] === limitedField.value
    // )
    const regularLimitedEnrolls = regularEnrolls.filter(enroll =>
      enroll.values[limitedField.key] === limitedField.value
    )
    const noFieldSpace = regularLimitedEnrolls.length >= limitedField.reserveCount

    if(noFieldSpace && reserveCount != null && spareEnrolls.length >= reserveCount) {
      throw new BadRequest('Field limit reached')
    }

    const noMoreRegularSpace = regularEnrolls.length >= maxParticipants
    return noMoreRegularSpace || noFieldSpace
  })
}

const getLimitedFieldIfEnrollMatch = (event, enroll) => {
  const optionFields = event.fields.filter(field => !!field.options)
  const enrollKeyValue = Object.entries(enroll.values)
    .find(([, value]) =>
      optionFields
        .find(field =>
          field.options.find(option => option.name === value && option.reserveCount != null))
    )
  return enrollKeyValue || []
}

const hasLimitedFields = fields => !!getLimitedFields(fields).length

const calculateSpareParticipants = (eventResult, eventEnrolls) => {
  const { fields, maxParticipants } = eventResult
  const enrollsWithEventLimitSpare = getIsSpareByEventLimit(maxParticipants, eventEnrolls)
  const limitedFields = getLimitedFields(fields)
  const enrollsByField = groupByOption(limitedFields, enrollsWithEventLimitSpare)
  return Object.values(enrollsByField).flat().sort(sortById) // TODO: sorting field from event properties
}

const getIsSpareByEventLimit = (maxParticipants, eventEnrolls) =>
  maxParticipants != null
    ? eventEnrolls.map((enroll, index) => ({ ...enroll, isSpare: index >= maxParticipants }))
    : eventEnrolls

const getLimitedFields = fields =>
  fields.map(field =>
    field.options
      ? createFieldOptionReserveCountKeyArray(field.name, field.options)
      : []
  ).flat()

// const createFieldOptionReserveCountKeyArray = (fieldName, options) =>
//   options.map(option =>
//     option.reserveCount != null
//       ? ([getFieldOptionKey(fieldName, option.name), option.reserveCount])
//       : null
//   ).filter(Boolean)

const createFieldOptionReserveCountKeyArray = (fieldName, options) => {
  const a = options.map(option => ([getFieldOptionKey(fieldName, option.name), option.reserveCount || 0]))
  console.log(a, a.filter(Boolean))
  return a.filter(Boolean)
}

const getFieldOptionKey = (fieldName, optionName) => `${fieldName}_${optionName}`

const groupByOption = (limitedFields, eventEnrolls) =>
  limitedFields.reduce((acc, [fieldOptionKey, reserveCount]) => ({
    ...acc,
    [fieldOptionKey]: eventEnrolls.filter(enroll =>
      Object.entries(enroll.values)
        .some(([optionKey, value]) => getFieldOptionKey(optionKey, value) === fieldOptionKey))
      .map((enroll, index) => ({ ...enroll, isSpare: index >= reserveCount || enroll.isSpare }))
  }), {})

module.exports = {
  isEnrollPossible,
  hasStillLimits,
  getLimitedFieldIfEnrollMatch,
  hasLimitedFields,
  calculateSpareParticipants
}
