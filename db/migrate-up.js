const { db } = require('./pgp')
const migrate = require('./migrate')

migrate.up()
  .finally(db.$pool.end)
