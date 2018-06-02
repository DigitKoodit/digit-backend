/* istanbul ignore file */
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const bodyParser = require('body-parser')

const routes = require('./routes')
const { authMiddlewares } = require('./auth')

const app = express()

logger.token('statuscolor', (req, res) => {
  const status = res.headersSent ? res.statusCode : undefined
  const color = status >= 500 ? 31 // red
    : status >= 400 ? 33 // yellow
      : status >= 300 ? 36 // cyan
        : status >= 200 ? 32 // green
          : 0 // no color
  return '\x1b[' + color + 'm' + status + '\x1b[0m'
})

app.enable('trust proxy') // FIXME: is this neccessary?

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

if(process.env.NODE_ENV !== 'test') {
  let loggerOutputFormat = ''
  if(process.env.NODE_ENV === 'development') {
    loggerOutputFormat = ':method :url :statuscolor :response-time ms - :res[content-length]'
  } else {
    loggerOutputFormat = '[:date[iso]] :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'
  }
  app.use(logger(loggerOutputFormat))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(authMiddlewares)
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api', routes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  if(err.status === 400) {
    console.log(err)
    res.send({ message: err.message, validationErrors: err.data })
  } else {
    if(process.env.NODE_ENV !== 'test') {
      console.error(err)
    }
    res.send({ message: err.message })
  }
})

module.exports = app
