const { NotFound } = require('http-errors')
const { db, pgp } = require('../../../db/pgp')

const findAll = () => db.any('SELECT * FROM user_account')

const findOne = ({ id, username }) => {
  const whereSql = id ? 'user_account_id = $1' : 'username = $1 OR email = $1'
  const where = pgp.as.format(whereSql, id || username)
  const sql = 'SELECT * FROM user_account WHERE $1:raw'
  return db.one(sql, where)
}

const findById = id => {
  if(!id) {
    throw new NotFound('user not found')
  }
  return db.one('SELECT * FROM user_account WHERE user_account_id = $1', id)
}

const create = data => {
  const sql = `INSERT INTO user_account (username, password, email, active, registration_token, registration_token_valid, user_role_id)
      VALUES ($[username], $[password], $[email], $[active], $[registrationToken], $[registrationTokenValid], $[userRoleId] ) ON CONFLICT DO NOTHING RETURNING user_account_id`
  const params = {
    ...data,
    userRoleId: 3, // TODO: what and when to set user role?
    active: false
  }
  return db.one(sql, params)
    .then(result => findById(result.user_account_id))
}

const update = (data, id) => {
  const sql = `UPDATE user_account SET 
    username = $[username], 
    password = $[password], 
    email = $[email], 
    active = $[active], 
    registration_token = $[registrationToken], 
    registration_token_valid = $[registrationTokenValid],
    user_role_id = $[roleId] 
  WHERE user_account_id = $[id] RETURNING user_account_id`
  const params = {
    ...data,
    id
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) {
        throw new NotFound('Registered user_account not found')
      }
      return result.user_account_id
    })
    .then(findById)
}

const save = (data, id) => id ? update(data, id) : create(data)

const fetchUserForRegistration = ({ email, username, registrationToken }) => {
  const whereSql = registrationToken ? 'email = $[email] AND registration_token = $[registrationToken]' : '(email = $[email] OR username = $[username]) AND registration_token IS NULL'
  const where = pgp.as.format(whereSql, { email, username, registrationToken })
  const sql = 'SELECT * FROM user_account WHERE $1:raw'
  return db.any(sql, where)
}

module.exports = {
  findAll,
  findById,
  findOne,
  save,
  fetchUserForRegistration
}
