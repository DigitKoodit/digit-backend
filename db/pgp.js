const promise = require('bluebird');

const options = {
  promiseLib: promise,
  query: (e) => {
    console.log(e.query);
  }
};
const pgp = require('pg-promise')(options);

const getDbName = function() {
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
const db = pgp(connectionOptions);

module.exports = db;