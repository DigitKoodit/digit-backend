const moment = require('moment')
const { BadRequest, Forbidden } = require('http-errors')
const isEmpty = require('lodash/isEmpty')
const { bifurcateBy } = require('../../helpers/helpers')

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

const getLimitedFields = fields => fields.reduce((acc, field) =>
  field.options
    ? ({
      ...acc,
      [field.name]: field.options.reduce(reduceOptionReserveCounts, {})
    })
    : acc,
{})

const reduceOptionReserveCounts = (acc, option) =>
  option.reserveCount
    ? ({
      ...acc,
      [option.name]: option.reserveCount
    })
    : acc

const determineIsSpare = (event, previousEnrolls, enroll) => {
  const { fields, maxParticipants, reserveCount } = event
  const eventParticipantLimit = maxParticipants + reserveCount

  if(previousEnrolls.length >= eventParticipantLimit) {
    throw new BadRequest('Event is full')
  }

  if(!hasStillLimits(event)) {
    return false
  }

  const limitedFields = getLimitedFields(fields)
  const hasLimitedFields = !isEmpty(limitedFields) && Object.values(limitedFields).filter(value => !!value).length

  const [spareEnrolls, regularEnrolls] = bifurcateBy(previousEnrolls, enroll => enroll.isSpare)
  if(!hasLimitedFields) {
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

const hasLimitedFields = fields => {
  const limitedFields = getLimitedFields(fields)
  return !isEmpty(limitedFields) && Object.values(limitedFields).filter(value => !!value).length
}

const getLimitedFieldIfEnrollMatch = (event, enroll) => {
  const optionFields = event.fields.filter(field => !!field.options)
  const enrollKeyValue = Object.entries(enroll.values)
    .find(([key, value]) =>
      optionFields
        .find(field =>
          field.options.find(option => option.name === value && option.reserveCount != null))
    )
  return enrollKeyValue || []
}

module.exports = {
  isEnrollPossible,
  determineIsSpare,
  hasStillLimits,
  getLimitedFieldIfEnrollMatch,
  getLimitedFields,
  hasLimitedFields
}
