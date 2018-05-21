const { db } = require('./pgp')
const migrate = require('./migrate')

migrate.down()
  .finally(db.$pool.end)
