const { NotFound } = require('http-errors')
const moment = require('moment')
const { db } = require('../../../db/pgp')

const file = {}

file.findById = id => {
  if(!id) {
    throw new NotFound('File not found')
  }
  return db.one('SELECT * FROM file WHERE file_id = $1', id)
}

file.findAll = () => {
  return db.any(`SELECT * FROM file`)
}

file.save = (data, id) => id ? update(data, id) : create(data)

const create = data => {
  const dataWithTimestamp = {
    ...data,
    createdAt: moment().format(),
    updatedAt: null
  }
  const sql = `INSERT INTO file (file_data)
      VALUES ($[dataWithTimestamp]) RETURNING file_id`
  const params = { dataWithTimestamp }
  return db.one(sql, params)
    .then(result => file.findById(result.file_id))
}

const update = ({ id, ...data }) => {
  const dataWithTimestamp = {
    ...data,
    updatedAt: moment().format()
  }

  const sql = `UPDATE file 
  SET file_data = $[dataWithTimestamp]
  WHERE file_id = $[id] RETURNING file_id`
  const params = {
    id,
    dataWithTimestamp
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) { throw new NotFound('File not found') }
      return file.findById(result.file_id)
    })
}

file.remove = id => {
  if(!id) { throw new NotFound('File not found') }
  return db.one('DELETE FROM file WHERE file_id = $1 RETURNING file_id', id)
}

module.exports = file
