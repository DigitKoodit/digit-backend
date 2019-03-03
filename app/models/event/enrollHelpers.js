const moment = require('moment')
const flatMap = require('lodash/flatMap')
const { BadRequest, Forbidden } = require('http-errors')

const hasStillLimits = event => event.reservedUntil && moment(event.reservedUntil).isAfter(moment())

const isEnrollPossible = (event, previousEnrollResults) => {
  const { maxParticipants, reserveCount } = event
  if(moment().isBefore(moment(event.activeAt)) || moment().isAfter(moment(event.activeUntil))) {
    throw new Forbidden(`Enrolling hasn't stated yet`)
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
    // No more limits
    return false
  }
  const regularEnrollCount = previousEnrolls.filter(enroll => !enroll.isSpare).length
  if(regularEnrollCount >= maxParticipants) {
    return true
  }

  // Iterate through values which are in enroll
  // Find corresponding field from event fields 
  // Returns an array which contains the option which should be added if space left
  // Wrap and return result in array so empty values are filtered out automatically by flatMap
  const limitedFieldOptions = flatMap(Object.entries(enroll.values), ([key, value]) => {
    const fieldData = fields.find(field => field.name === key && field.options)
    if(!fieldData) {
      return []
    }
    const option = fieldData.options.find(option => option.name === value)
    return [{ ...option, fieldName: fieldData.name }]
  })

  // Does array magic and calculates how many enrolls with specific option has
  const enrollsByOptionType = limitedFieldOptions.map(option =>
    previousEnrolls.map(enroll => enroll.values)
      .reduce((acc, value) =>
        value[option.fieldName] === option.name
          ? ({
            ...acc,
            [option.name]: acc[option.name]
              ? acc[option.name] + 1
              : 1
          })
          : acc
        , {}))

  // Check if reserve count is full by how many enrolls have come before next new enroll
  const isSpare = limitedFieldOptions.some(optionLimit =>
    enrollsByOptionType.find(enrollsToOption =>
      enrollsToOption[optionLimit.name] >= optionLimit.reserveCount))
  return isSpare
}

const getLimitedFieldIfEnrollMatch = (event, enroll) => {
  const optionFields = event.fields.filter(field => !!field.options)
  const enrollKeyValue = Object.entries(enroll.values)
    .find(([key, value]) =>
      optionFields
        .find(field =>
          field.options.find(option => option.name === value && option.reserveCount != null))
    )

  // if(enrollKeyValue) {
  //   const reserveCount = optionFields.find(field => field.options.find(option => option.name === enrollKeyValue[0] && option.reserveCount != null))
  //   return [...enrollKeyValue, reserveCount]
  // }
  return enrollKeyValue || []
}

module.exports = {
  isEnrollPossible,
  determineIsSpare,
  hasStillLimits,
  getLimitedFieldIfEnrollMatch
}