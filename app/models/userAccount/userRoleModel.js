const { NotFound } = require('http-errors')

const findAll = db => db.any('SELECT * FROM user_role')

const findOne = (db, { id }) => {
  const sql = 'SELECT * FROM user_role WHERE user_role_id = $1'
  return db.one(sql, id)
}

const findById = (db, id) => {
  if(!id) {
    throw new NotFound('User role not found')
  }
  return db.one('SELECT * FROM user_role WHERE user_role_id = $1', id)
}

const create = (db, data) => {
  const sql = `INSERT INTO user_role (user_role_data)
      VALUES ($1) RETURNING user_role_id`
  return db.one(sql, [data])
}

const update = (db, data, id) => {
  const sql = `UPDATE user_role SET 
    user_role_data = $[data]
    WHERE user_role_id = $[id] RETURNING user_role_id`
  return db.one(sql, { id, data })
}

const save = (db, data, id) => (id ? update(db, data, id) : create(db, data))
  .then(result => findById(db, result.user_role_id))

const removeAll = db => process.env.NODE_ENV === 'test' &&
  db.none('TRUNCATE TABLE user_role RESTART IDENTITY CASCADE')

module.exports = {
  findAll,
  findOne,
  findById,
  save,
  removeAll,
  create,
  update
}
