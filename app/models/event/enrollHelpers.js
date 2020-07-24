const moment = require('moment')
const { BadRequest, Forbidden } = require('http-errors')
const { sortById } = require('../../helpers/helpers')

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
  // TODO: sorting by given field must be done here before and after spare calculations
  // Should this function to be called in decorator?
  const enrollsWithPossibleSpare = calculatePossibleSparePositions(eventResult, eventEnrolls)
  return enrollsWithPossibleSpare.sort(sortById)
}

const getIsSpareByEventLimit = (maxParticipants, eventEnrolls) =>
  eventEnrolls.map((enroll, index) => ({
    ...enroll,
    isSpare: maxParticipants == null
      ? false
      : index >= maxParticipants
  }))

const getLimitedFields = fields =>
  fields.map(field =>
    field.options
      ? createFieldOptionReserveCountKeyArray(field.name, field.options)
      : []
  ).flat()

const createFieldOptionReserveCountKeyArray = (fieldName, options) =>
  options.map(option => ([getFieldOptionKey(fieldName, option.name), option.reserveCount]))
const getFieldOptionKey = (fieldName, optionName) => `${fieldName}_${optionName}`

const calculatePossibleSparePositions = (eventResult, eventEnrolls) => {
  const { fields, maxParticipants } = eventResult
  const enrollsWithEventLimitSpare = getIsSpareByEventLimit(maxParticipants, eventEnrolls)
  const limitedFields = getLimitedFields(fields)

  if(!limitedFields.length) {
    return enrollsWithEventLimitSpare
  }
  const enrollsByOption = groupAndSetIsSpareByOption(limitedFields, enrollsWithEventLimitSpare)
  return Object.values(enrollsByOption).flat()
}

const groupAndSetIsSpareByOption = (limitedFields, eventEnrolls) =>
  limitedFields.reduce((acc, [fieldOptionKey, reserveCount]) => {
    const matchOptionKeyWithField = ([optionKey, value]) =>
      getFieldOptionKey(optionKey, value) === fieldOptionKey

    const findEnrollsWithOption = enroll =>
      Object.entries(enroll.values).some(matchOptionKeyWithField)

    // When reserveCount is unset allow as many enrolls as possible
    const setIsSpareToEnroll = (enroll, index) =>
      reserveCount == null
        ? enroll
        : ({ ...enroll, isSpare: index >= reserveCount || enroll.isSpare })

    acc[fieldOptionKey] = eventEnrolls
      .filter(findEnrollsWithOption)
      .map(setIsSpareToEnroll)
    return acc
  }, {})

module.exports = {
  isEnrollPossible,
  getLimitedFields,
  hasStillLimits,
  getLimitedFieldIfEnrollMatch,
  hasLimitedFields,
  calculateSpareParticipants
}
