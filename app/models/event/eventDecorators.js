const moment = require('moment')
const formatDateOrNull = dateString => dateString ? moment(dateString).format() : null

const decorate = event => {
  const { event_id: id } = event
  const {
    name,
    description,
    fields,
    activeAt,
    activeUntil,
    reservedUntil,
    isVisible,
    isPublished,
    maxParticipants,
    reserveCount
  } = event.event_data
  return {
    id,
    name,
    fields,
    description,
    isVisible,
    isPublished: !!isPublished,
    activeAt: formatDateOrNull(activeAt),
    activeUntil: formatDateOrNull(activeUntil),
    reservedUntil: formatDateOrNull(reservedUntil),
    maxParticipants,
    reserveCount
  }
}

const decorateList = events =>
  events.map(decorate)

module.exports = {
  decorate,
  decorateList
}
