const { NotFound } = require('http-errors')
const { db } = require('../../../db/pgp')

const findAll = () => db.any('SELECT * FROM user_role')

const findOne = ({ id }) => {
  const sql = 'SELECT * FROM user_role WHERE user_role_id = $1'
  return db.one(sql, id)
}

const findById = id => {
  if(!id) {
    throw new NotFound('User role not found')
  }
  return db.one('SELECT * FROM user_role WHERE user_role_id = $1', id)
}

const create = data => {
  const sql = `INSERT INTO user_role (user_role_data
      VALUES ($1) RETURNING user_role_id`
  return db.one(sql, data)
    .then(result => findById(result.user_role_id))
}

const update = (data, id) => {
  const sql = `UPDATE user_role SET 
    user_role_data = $[data]
    WHERE user_role_id = $[id] RETURNING user_role_id`
  return db.one(sql, { id, data })
    .then(result => {
      if(!result) {
        throw new NotFound('User role not found')
      }
      return result.user_role_id
    })
}

const save = (data, id) => id ? update(data, id) : create(data)

module.exports = {
  findAll,
  findOne,
  findById,
  save
}
