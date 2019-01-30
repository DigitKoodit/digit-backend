const sqlQueries = [
  `CREATE TABLE event_enroll (
    event_enroll_id SERIAL PRIMARY KEY,
    event_id INT REFERENCES event(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    event_enroll_data JSONB NOT NULL DEFAULT '{}'
  )`
]
const sqlQueriesDown = [
  'DROP TABLE event_enroll'
]
module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
