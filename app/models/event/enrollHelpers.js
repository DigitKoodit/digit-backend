const moment = require('moment')
const { BadRequest, Forbidden } = require('http-errors')
const { sortById } = require('../../helpers/helpers')
const uniqBy = require('lodash/uniqBy')

const hasStillLimits = event => event.reservedUntil && moment(event.reservedUntil).isAfter(moment())

const isEnrollPossible = (event, previousEnrolls) => {
  const { maxParticipants, reserveCount } = event
  if(moment().isBefore(moment(event.activeAt))) {
    throw new Forbidden(`Enrolling hasn't stated yet`)
  } else if(moment().isAfter(moment(event.activeUntil))) {
    throw new Forbidden(`Enrolling has ended`)
  }
  if(maxParticipants != null) {
    const eventParticipantLimit = maxParticipants + reserveCount
    if(previousEnrolls.length >= eventParticipantLimit) {
      throw new BadRequest('Event is full')
    }
  }
  return true
}

const isOptionAvailable = (event, previousEnrolls, enroll) => {
  const { fields, reserveCount } = event
  const limitedFields = getLimitedFields(fields)
  if(!limitedFields.length) {
    return true
  }
  const enrollFieldOptionKeyPair = getLimitedFieldIfEnrollMatch(fields, enroll)
  const fieldOptionKey = getFieldOptionKey(enrollFieldOptionKeyPair[0], enrollFieldOptionKeyPair[1])

  const optionReserveCount = limitedFields.find(([field]) => field === fieldOptionKey)[1]
  if(optionReserveCount == null) {
    return true
  }

  const enrollsByOption = groupAndSetIsSpareByOption(limitedFields, previousEnrolls)
  const isOptionReserveFull = enrollsByOption[fieldOptionKey].length >= optionReserveCount
  if(!isOptionReserveFull) {
    return true
  }

  const spareCount = previousEnrolls.filter(({ isSpare }) => isSpare).length
  if(spareCount >= reserveCount) {
    throw new Forbidden(`Enroll option limit is full`)
  }
}

const getLimitedFieldIfEnrollMatch = (fields, enroll) => {
  const optionFields = fields.filter(field => !!field.options)
  const enrollKeyValue = Object.entries(enroll.values)
    .find(([, value]) =>
      optionFields.some(field =>
        field.options.some(option => option.name === value && option.reserveCount != null))
    )
  return enrollKeyValue || []
}

const hasLimitedFields = fields => !!getLimitedFields(fields).length

const calculateSpareParticipants = (eventResult, eventEnrolls) => {
  // TODO: sorting by given field must be done here before and after spare calculations
  // Should this function to be called in decorator?
  const enrollsWithPossibleSpare = calculatePossibleSparePositions(eventResult, eventEnrolls)
  return enrollsWithPossibleSpare
}

const getIsSpareByEventLimit = (maxParticipants, eventEnrolls) => {
  let nonSpareEnrollCount = 0
  return eventEnrolls.map(enroll => {
    if(enroll.isSpare) {
      return enroll
    }
    const isSpare = maxParticipants == null
      ? false
      : nonSpareEnrollCount >= maxParticipants
    const updatedEnroll = ({
      ...enroll,
      isSpare
    })
    ++nonSpareEnrollCount
    return updatedEnroll
  })
}

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
  const limitedFields = getLimitedFields(fields)

  if(!limitedFields.length) {
    return getIsSpareByEventLimit(maxParticipants, eventEnrolls)
  }
  const enrollsByOption = groupAndSetIsSpareByOption(limitedFields, eventEnrolls)
  const enrollsWithOptionSpares = Object.values(enrollsByOption)
    .flat()
    .sort(sortById) // TODO: sorting field to event property
  const enrollsWithEventLimitSpare = getIsSpareByEventLimit(maxParticipants, uniqBy(enrollsWithOptionSpares, 'id'))
  return enrollsWithEventLimitSpare
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
        : ({ ...enroll, isSpare: index >= reserveCount })

    acc[fieldOptionKey] = eventEnrolls
      .filter(findEnrollsWithOption)
      .map(setIsSpareToEnroll)
    return acc
  }, {})

module.exports = {
  isEnrollPossible,
  isOptionAvailable,
  getLimitedFields,
  hasStillLimits,
  getLimitedFieldIfEnrollMatch,
  hasLimitedFields,
  calculateSpareParticipants
}
