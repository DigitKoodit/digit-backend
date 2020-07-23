const moment = require('moment')
const { sortByCreatedAt } = require('../../helpers/helpers')

const decoratePublic = eventEnroll => {
  const { event_enroll_id: id, event_id: eventId, event_enroll_data: eventEnrollData, fields } = eventEnroll
  const { values = {}, createdAt } = eventEnrollData
  const publicValues = fields.filter(field => field.public)
    .reduce((acc, field) =>
      ({ ...acc, [field.name]: values[field.name] }), {})
  return {
    id,
    eventId,
    values: publicValues,
    createdAt: moment(createdAt).format()
  }
}

const decorate = eventEnroll => {
  const { event_enroll_id: id, event_id: eventId, event_enroll_data: eventEnrollData } = eventEnroll
  const { values, createdAt } = eventEnrollData
  return {
    id,
    eventId,
    values,
    createdAt: moment(createdAt).format()
  }
}

const decorateList = eventEnrolls =>
  eventEnrolls.map(decorate).sort(sortByCreatedAt)

const decoratePublicList = eventEnrolls =>
  eventEnrolls.map(decoratePublic).sort(sortByCreatedAt)

module.exports = {
  decorate,
  decoratePublic,
  decorateList,
  decoratePublicList
}
