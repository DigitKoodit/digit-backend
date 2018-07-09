const { NotFound } = require('http-errors')
const moment = require('moment')
const isNil = require('lodash/isNil')
const { db } = require('../../../db/pgp')

const sponsor = {}

sponsor.findById = id => {
  if(!id) {
    throw new NotFound('Sponsor not found')
  }
  return db.one('SELECT * FROM sponsor WHERE sponsor_id = $1', id)
}

sponsor.findAll = activeOnly => {
  return db.any(`SELECT * FROM sponsor ${!isNil(activeOnly) ? `WHERE (sponsor_data->>'activeAt')::timestamp < $[currentTime] AND (sponsor_data->>'activeUntil')::timestamp > $[currentTime]` : ''}`, { currentTime: moment().format() })
}

sponsor.save = (data, id) => id ? update(data, id) : create(data)

const create = data => {
  const sql = `INSERT INTO sponsor (sponsor_data)
      VALUES ($[data]) RETURNING sponsor_id`
  const params = { data }
  return db.one(sql, params)
    .then(result => sponsor.findById(result.sponsor_id))
}

const update = ({ id, ...data }) => {
  const sql = `UPDATE sponsor 
  SET sponsor_data = $[data]
  WHERE sponsor_id = $[id] RETURNING sponsor_id`
  const params = {
    id,
    data
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) { throw new NotFound('Sponsor not found') }
      return sponsor.findById(result.sponsor_id)
    })
}

sponsor.remove = id => {
  if(!id) { throw new NotFound('Sponsor not found') }
  return db.one('DELETE FROM sponsor WHERE sponsor_id = $1 RETURNING sponsor_id', id)
}

module.exports = sponsor
