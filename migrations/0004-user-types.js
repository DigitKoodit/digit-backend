
const passwordHash = require('pbkdf2-password-hash')

// Sorry for this implementation. Originally meant to import data from json files
const insertDummyAdmin = () =>
  passwordHash.hash('admin')
    .then(hash => [
      {
        query: `INSERT INTO user_account (username, email, password, user_role_id, active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO UPDATE SET user_role_id = 1`,
        values: [['admin', 'admin@admin.fi', hash, 1, true]]
      }])

// Set visitor role to all user_accounts except already existing
const sqlQueries = [
  `CREATE TABLE user_role (user_role_id SERIAL PRIMARY KEY, user_role_data JSONB NOT NULL DEFAULT '{}')`,
  {
    query: 'INSERT INTO user_role (user_role_data) VALUES($1)',
    values: [
      [{ name: 'admin', 'accessLevel': 1 }],
      [{ name: 'user', 'accessLevel': 2 }],
      [{ name: 'visitor', 'accessLevel': 3 }]
    ]
  },
  `ALTER TABLE user_account ADD COLUMN user_role_id INT NOT NULL REFERENCES user_role ON DELETE RESTRICT ON UPDATE CASCADE DEFAULT 3`
]

const sqlQueriesDown = [
  'ALTER TABLE user_account DROP COLUMN user_role_id',
  'DROP TABLE user_role'
]

module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries, insertDummyAdmin()),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
