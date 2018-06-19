const sqlQueries = [
  `CREATE TABLE user_account (
    user_account_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT NOT NULL,
    active BOOLEAN NOT NULL,
    registration_token TEXT,
    registration_token_valid TIMESTAMP
  )`
]

const sqlQueriesDown = [
  'DROP TABLE user_account'
]

module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
