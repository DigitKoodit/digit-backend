const { NotFound } = require('http-errors')
const moment = require('moment')
const isNil = require('lodash/isNil')

const eventEnroll = {}
eventEnroll.findById = (db, id) => {
  if(!id) {
    throw new NotFound()
  }
  return db.one(`SELECT ee.*, e.event_data->'fields' fields
      FROM event_enroll ee 
      LEFT JOIN event e ON ee.event_id = e.event_id
      WHERE event_enroll_id = $1`, id)
}

eventEnroll.findAll = (db, eventId, activeEventsOnly) =>
  db.any(`SELECT ee.*, e.event_data->'fields' fields
    FROM event_enroll ee
    LEFT JOIN event e ON e.event_id = ee.event_id
    WHERE e.event_id = $[eventId]
    ${!isNil(activeEventsOnly)
    ? `AND ((e.event_data->>'isVisible')::boolean OR (e.event_data->>'isPublished')::boolean)`
    : ''} ORDER BY event_enroll_id`,
  { eventId, currentTime: moment().format() })

eventEnroll.save = (db, eventId, data, id) => id
  ? update(db, eventId, data, id)
  : create(db, eventId, data)

const create = (db, eventId, data) => {
  const dataWithTimestamp = {
    ...data,
    createdAt: moment().format()
  }
  const sql = `INSERT INTO event_enroll (event_id, event_enroll_data)
      VALUES ($[eventId], $[data]) RETURNING event_enroll_id`
  const params = { eventId, data: dataWithTimestamp }
  return db.one(sql, params)
    .then(result => eventEnroll.findById(db, result.event_enroll_id))
}

const update = (db, eventId, { id, ...data }) => {
  const dataWithTimestamp = {
    ...data,
    updatedAt: moment().format()
  }
  const sql = `UPDATE event_enroll 
    SET event_enroll_data = $[data]
    WHERE event_enroll_id = $[id] AND event_id = $[eventId] RETURNING event_enroll_id`
  const params = {
    eventId,
    id,
    data: dataWithTimestamp
  }
  return db.one(sql, params)
    .then(result =>
      eventEnroll.findById(db, result.event_enroll_id))
    .catch(error => {
      throw new NotFound('Event enroll not found')
    })
}

eventEnroll.remove = (db, id) => {
  if(!id) { throw new NotFound('Event enroll not found') }
  return db.one('DELETE FROM event_enroll WHERE event_enroll_id = $1 RETURNING event_enroll_id', id)
}

eventEnroll.recalculateSpareEnrolls = (db, eventId) => {
  const updateFromAllSpareEnrolls = `UPDATE event_enroll 
    SET event_enroll_data = jsonb_set(event_enroll_data, '{isSpare}', 'false')
    WHERE event_enroll_id = (
      SELECT ee.event_enroll_id
        FROM event_enroll ee
        LEFT JOIN event e ON ee.event_id = e.event_id
        WHERE e.event_id = $[eventId] AND (ee.event_enroll_data ->> 'isSpare')::boolean
      ORDER BY ee.event_enroll_data->>'createdAt'
      LIMIT 1
      )
    RETURNING event_enroll_id
  `
  return db.oneOrNone(updateFromAllSpareEnrolls, { eventId })
}

eventEnroll.recalculateSpareEnrollWithLimitedField = (db, eventId, fieldName, fieldValue) => {
  const updateOnlyOnesWithFieldName = `UPDATE event_enroll 
    SET event_enroll_data = jsonb_set(event_enroll_data, '{isSpare}', 'false')
    WHERE event_enroll_id = (
      SELECT ee.event_enroll_id
        FROM event_enroll ee
        LEFT JOIN event e ON ee.event_id = e.event_id
        WHERE e.event_id = $[eventId] AND (ee.event_enroll_data ->> 'isSpare')::boolean
          AND ee.event_enroll_data->'values'->>'$[fieldName:value]' = '$[fieldValue:value]'
      ORDER BY ee.event_enroll_data->>'createdAt'
      LIMIT 1
      ) 
    RETURNING event_enroll_id
  `
  return db.oneOrNone(updateOnlyOnesWithFieldName, { eventId, fieldName, fieldValue })
}

module.exports = eventEnroll
