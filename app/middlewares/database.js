const { db } = require('../../db/pgp')

// Has to use callback otherwise transaction is committed immediately
const startTx = db => cb => db.tx(txDb => cb(txDb))

const databaseMiddleware = (req, res, next) => {
  if(!req.db) {
    req.db = db
  }
  req.startTx = startTx(req.db)
  next()
}

module.exports = databaseMiddleware