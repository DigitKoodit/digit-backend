const { migrateAndStartServer } = require('./server')
migrateAndStartServer()
  .then(() => console.log('Server running'))