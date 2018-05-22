
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

migrate.up()
  .then(() => {
    app.listen(port, () => `Listening on port ${port}`)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
