const sqlQueries = [
  `CREATE TABLE event (
    event_id SERIAL PRIMARY KEY,
    event_data JSONB NOT NULL DEFAULT '{}'
  )`
]
const sqlQueriesDown = [
  'DROP TABLE event'
]
module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
