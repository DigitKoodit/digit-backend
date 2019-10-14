const { NotFound } = require('http-errors')
const moment = require('moment')
const isNil = require('lodash/isNil')

const event = {}
event.findById = (db, id) => {
  if(!id) {
    throw new NotFound('Event not found')
  }
  return db.one('SELECT * FROM event WHERE event_id = $1', id)
    .catch(error => {
      throw new NotFound('Event not found', error)
    })
}

event.findByIdPublic = (db, id) => {
  if(!id) {
    throw new NotFound('Event not found')
  }
  return db.one(`SELECT * FROM event WHERE event_id = $[id]
      AND ((event_data->>'isVisible')::boolean OR (event_data->>'isPublished')::boolean)`,
  { id, currentTime: moment().format() })
    .catch(error => {
      throw new NotFound('Event not found', error)
    })
}

event.findAll = (db, activeOnly) => {
  return db.any(`SELECT * FROM event ${!isNil(activeOnly)
    ? `WHERE ((event_data->>'isVisible')::boolean OR (event_data->>'isPublished')::boolean)`
    : ''}`,
  { currentTime: moment().format() })
}

event.save = (db, data, id) => id ? update(db, data, id) : create(db, data)

const create = (db, data) => {
  const sql = `INSERT INTO event (event_data)
      VALUES ($[data]) RETURNING event_id`

  const params = { data }
  return db.one(sql, params)
    .then(result => event.findById(db, result.event_id))
}

const update = (db, { id, ...data }) => {
  const sql = `UPDATE event 
    SET event_data = $[data]
    WHERE event_id = $[id] RETURNING event_id`
  const params = {
    id,
    data
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) { throw new NotFound('Event not found') }
      return event.findById(db, result.event_id)
    })
}

event.remove = (db, id) => {
  if(!id) { throw new NotFound('Event not found') }
  return db.one('DELETE FROM event WHERE event_id = $1 RETURNING event_id', id)
}

module.exports = event
