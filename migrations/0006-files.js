const sqlQueries = [
  `CREATE TABLE file (
    file_id SERIAL PRIMARY KEY,
    created_by INT REFERENCES user_account(user_account_id) ON DELETE SET NULL ON UPDATE CASCADE,
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
