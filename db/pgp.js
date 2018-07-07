const Umzug = require('umzug')
const Bluebird = require('bluebird')
const _ = require('lodash')
const monitor = require('pg-monitor')

const options = {
  promiseLib: Bluebird
}

const pgp = require('pg-promise')(options)

monitor.attach(options)
monitor.setTheme('matrix')
monitor.setLog((msg, info) => {
  // save the screen messages into your own log file;
})
const getDbName = () => {
  if(process.env.PGDATABASE) {
    return process.env.PGDATABASE
  }
  switch(process.env.NODE_ENV) {
    case 'test':
      return 'digit_testing'
    case 'production':
      return 'digit'
    case 'staging':
      return 'digit_staging'
    case 'development':
      return 'digit_dev'
    default:
      throw new Error('INVALID ENVIRONMENT, cannot determine database name')
  }
}

const connectionOptions = {
  user: process.env.PGUSER || 'digit',
  host: process.env.PGHOST || 'localhost',
  password: process.env.PGPASSWORD || 'digit',
  database: getDbName(),
  port: process.env.PGPORT || 5432
}
const db = pgp(connectionOptions)

const runQueriesInSeries = (client, data) => {
  return Bluebird.mapSeries(data.values, values => {
    return client.query(data.query, values)
  })
}

const getMigrationEngine = () => {
  return db.connect()
    .then(client => {
      const applyInTransaction = (sqlQueries, devDataQueries) => {
        return client.query('BEGIN')
          .then(() =>
            Bluebird.mapSeries(sqlQueries, sql => {
              if(_.isObject(sql)) {
                return runQueriesInSeries(client, sql)
              }
              return client.query(sql)
            }))
          .then(() => {
            if(process.env.NODE_ENV === 'development' && devDataQueries) {
              return Bluebird.mapSeries(devDataQueries, data => {
                return runQueriesInSeries(client, data)
              })
            }
            return true
          })
          .then(() => client.query('COMMIT'))
          .catch(err => {
            client.query('ROLLBACK')
            throw err
          })
      }
      const umzug = new Umzug({
        storageOptions: {
          path: process.cwd() + '/migrations/applied_' + getDbName() + '.json'
        },
        migrations: {
          params: [applyInTransaction, client]
        }
      })
      return [umzug, client]
    })
}

module.exports = {
  pgp,
  db,
  getMigrationEngine
}
