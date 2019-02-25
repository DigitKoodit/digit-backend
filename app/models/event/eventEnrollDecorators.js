const filter = require('lodash/filter')
const moment = require('moment')

const decoratePublic = eventEnroll => {
  const { event_enroll_id: id, event_id: eventId, event_enroll_data, fields } = eventEnroll
  const { isSpare, values = {}, createdAt } = event_enroll_data
  const publicFields = filter(fields, 'public')
  const publicValues = publicFields.reduce((acc, field) => ({ ...acc, [field.name]: values[field.name] }), {})
  return {
    id,
    eventId,
    values: publicValues,
    isSpare,
    createdAt: moment(createdAt).format()
  }
}

const decorate = eventEnroll => {
  const { event_enroll_id: id, event_id: eventId, event_enroll_data } = eventEnroll
  const { isSpare = false, values, createdAt } = event_enroll_data
  return {
    id,
    eventId,
    values,
    isSpare,
    createdAt: moment(createdAt).format()
  }
}

const decorateList = events =>
  events.map(decorate).sort((a, b) =>
    moment(a.createdAt).isBefore(b.createdAt)
      ? -1
      : 1
  )

const decoratePublicList = events =>
  events.map(decoratePublic).sort((a, b) =>
    moment(a.createdAt).isBefore(b.createdAt)
      ? -1
      : 1
  )

module.exports = {
  decorate,
  decoratePublic,
  decorateList,
  decoratePublicList
}
