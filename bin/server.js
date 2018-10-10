
const app = require('../app')
const normalizePort = val => {
  const port = parseInt(val, 10)
  if(isNaN(port)) {
    return val
  }
  if(port >= 0) {
    return port
  }
  return false
}

const port = normalizePort(process.env.PORT || '3001')
app.set('port', port)

const migrate = require('../db/migrate')
const { db, pgp } = require('../db/pgp')

migrate.up()
  .then(() => {
    app.listen(port, () => `Listening on port ${port}`)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully.')
  app.close(() => {
    console.log('object', pgp)
    db.proc('version')
      .then(data => {
        console.log('CONNECTION ACYIVE')
        // SUCCESS
        // data.version =
        // 'PostgreSQL 9.5.1, compiled by Visual C++ build 1800, 64-bit'
      })
      .catch(error => {
        console.log('EREOROR', error)
      })
    console.log('Closed out remaining connections.')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(0)
  }, 10 * 1000)
}

// TERM signal e.g. kill
process.on('SIGTERM', gracefulShutdown)
// TERM signal e.g. ctrl + c
process.on('SIGINT', gracefulShutdown)
