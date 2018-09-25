const decoratePublic = event => {
  const { event_id: id } = event
  const { name, description, fields, participants, maxParticipants, reserveCount } = event.event_data
  return {
    id,
    name,
    fields,
    description,
    maxParticipants,
    participants,
    reserveCount
  }
}

const decorate = event => {
  const { event_id: id } = event
  const { name, description, fields, participants, activeAt, activeUntil, isVisible, maxParticipants, reserveCount } = event.event_data
  return {
    id,
    name,
    fields,
    description,
    participants,
    isVisible,
    activeAt,
    activeUntil,
    maxParticipants,
    reserveCount
  }
}

const decorateList = events =>
  events.map(decorate)

const decoratePublicList = events =>
  events.map(decoratePublic)

module.exports = {
  decorate,
  decoratePublic,
  decorateList,
  decoratePublicList
}
