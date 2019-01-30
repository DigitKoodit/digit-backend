const { NotFound } = require('http-errors')
const moment = require('moment')

const file = {}

file.findById = (db, id) => {
  if(!id) {
    throw new NotFound('File not found')
  }
  return db.one('SELECT * FROM file WHERE file_id = $1', id)
}

file.findByName = (db, name) =>
  db.one(`SELECT * FROM file WHERE file_data->>'filename' = $1`, name)

file.findAll = db => {
  return db.any(`SELECT * FROM file`)
}

file.save = (db, data, user, id) => id
  ? update(db, data, user, id)
  : create(db, data, user)

file.saveBatch = (db, files, user) => db.tx(t =>
  t.batch(files.map(file => create(t, file, user))))

const create = (db, data, user) => {
  const dataWithTimestamp = {
    ...data,
    createdAt: moment().format()
  }
  const sql = `INSERT INTO file (created_by, file_data)
      VALUES ($[userId], $[dataWithTimestamp]) RETURNING file_id`
  const params = { dataWithTimestamp, userId: user.user_account_id }
  return db.one(sql, params)
    .then(result => file.findById(db, result.file_id))
}

const update = (db, { id, ...data }, user, fileId) => {
  const dataWithTimestamp = {
    ...data,
    updatedAt: moment().format()
  }

  const sql = `UPDATE file 
  SET file_data = $[dataWithTimestamp]
  WHERE file_id = $[fileId] RETURNING file_id`
  const params = {
    fileId,
    dataWithTimestamp
  }
  return db.one(sql, params)
    .then(result => file.findById(db, result.file_id))
}

file.remove = (db, id) => {
  if(!id) { throw new NotFound('File not found') }
  return db.one('DELETE FROM file WHERE file_id = $1 RETURNING file_id', id)
}

module.exports = file
