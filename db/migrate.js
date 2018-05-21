const { getMigrationEngine } = require('./pgp')

const doMigration = (action, cb, opts) =>
  getMigrationEngine()
    .then(([umzug, client]) => {
      return umzug[action](opts)
        .then(cb)
        .catch(err => {
          console.error(err)
          throw err
        })
        .finally(() => client.done())
    })

module.exports = {
  up: opts => doMigration('up', migrations => console.log(`Applied ${migrations.length} migrations`), opts),
  down: opts => doMigration('down', migrations => console.log(`Applied down ${migrations.length} migrations`), opts)
}
