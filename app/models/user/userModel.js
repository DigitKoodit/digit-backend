const { NotFound, BadRequest } = require('http-errors')
const db = require('../../../db/pgp')

const User = {}

User.findOne = ({ id, username }) => {
  const whereSql = id ? 'user_id = $1' : 'username = $1 OR email = $1'
  const where = db.as.format(whereSql, id || username)
  const sql = 'SELECT * FROM user WHERE $1:raw'
  console.log('findOne', sql)
  db.one(sql, where)
}

User.findById = id =>
  db.oneOrNone('SELECT username, password, email FROM user WHERE user_id = $1', id)

const create = data => {
  const sql = `INSERT INTO user (username, password, email, active)
      VALUES ($[username], $[password], $[email], $[active])`
  const params = {
    ...data,
    active: false
  }
  return db.one(sql, params)
}

const update = (data, id) => {
  const sql = `UPDATE user SET username username = $[username], password = $[password], email = $[email], active = $[active]
  WHERE user_id = $[id]`
  const params = {
    ...data,
    id
  }
  return db.oneOrNone(sql, params)
    .then(data => {
      if(!data) {
        throw new NotFound('Registered user not found')
      }
      return data
    })
}

User.save = (data, id) => id ? update(data, id) : create(data)

User.fetchUserForRegistration = ({ email, token }) => {
  if(!email && !token) {
    throw new BadRequest('Invalid filter')
  }
  const whereSql = token ? 'email = $[email] AND registration_token = $[token]' : 'email = $[email]'
  const where = db.as.format(whereSql, { email, token })
  const sql = 'SELECT * FROM user WHERE $1:raw'
  return db.one(sql, where)
}

module.exports = User
