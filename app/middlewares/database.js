const { db } = require('../../db/pgp')

const databaseMiddleware = (req, res, next) => {
  if(!req.db) {
    req.db = db
  }
  next()
}

module.exports = databaseMiddleware