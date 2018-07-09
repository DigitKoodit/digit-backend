const sqlQueries = [
  `CREATE TABLE sponsor (
    sponsor_id SERIAL PRIMARY KEY,
    sponsor_data JSONB NOT NULL DEFAULT '{}'
  )`
]

const sqlQueriesDown = [
  'DROP TABLE sponsor'
]

module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
