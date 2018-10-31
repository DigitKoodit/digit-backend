const sqlQueries = [
  `CREATE TABLE file (
    file_id SERIAL PRIMARY KEY,
    file_data JSONB NOT NULL DEFAULT '{}'
  )`
]
const sqlQueriesDown = [
  'DROP TABLE file'
]
module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
