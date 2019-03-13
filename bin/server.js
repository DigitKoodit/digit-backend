if(process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const http = require('http')
const app = require('../app')

const isTesting = process.env.NODE_ENV === 'test'
const port = isTesting ? process.env.TEST_PORT : (process.env.PORT || '3001')
app.set('port', port)

const migrate = require('../db/migrate')
const { db, pgp } = require('../db/pgp')

const server = http.createServer(app)
server.on('close', () => {
  db.$pool.end()
})

const startServer = () =>
  new Promise(resolve => {
    server.listen(port, () => {
      console.log(`Server listening port ${port}`)
      resolve()
    })
  })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })

const migrateAndStartServer = () =>
  migrate.up()
    .then(() =>
      new Promise(resolve => {
        server.listen(port, () => {
          console.log(`Server listening port ${port}`)
          resolve()
        })
      })
    )
    .catch(err => {
      console.error(err)
      process.exit(1)
    })

// const gracefulShutdown = () => {
//   console.log('Received kill signal, shutting down gracefully.')
//   server.close(() => {
//     console.log('SIG PGP OBJECT', pgp)
//     db.proc('version')
//       .then((data) => {
//         console.log('SIG CONNECTION ACTIVE', data)
//       })
//       .catch(error => {
//         console.log('SIG ERROR', error)
//       })
//     process.exit(0)
//   })
//   setTimeout(() => {
//     console.error('Could not close connections in time, forcefully shutting down')
//     process.exit(0)
//   }, 10 * 1000)
// }

// // TERM signal e.g. kill
// process.on('SIGTERM', gracefulShutdown)
// // TERM signal e.g. ctrl + c
// process.on('SIGINT', gracefulShutdown)

module.exports = {
  startServer,
  migrateAndStartServer,
  app,
  server
}
