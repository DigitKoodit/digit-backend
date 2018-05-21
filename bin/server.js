
const app = require('../app')
const debug = require('debug')('digit:server')
const http = require('http')

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

migrate.up()
  .then(() => {
    const server = http.createServer(app)
    server.listen(port)
    // app.io = require('../app/socket')(server)
    const onError = error => {
      if(error.syscall !== 'listen') {
        throw error
      }

      const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

      switch(error.code) {
        case 'EACCES':
          console.error(`${bind} requires elevated privileges`)
          return process.exit(1)
        case 'EADDRINUSE':
          console.error(`${bind} is already in use`)
          return process.exit(1)
        default:
          throw error
      }
    }  

    const onListening = () => {
      const addr = server.address()
      const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port
      debug(`Listening on ${bind}`)
    }

    server.on('error', onError)
    server.on('listening', onListening)
   
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })

