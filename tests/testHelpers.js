const supertest = require('supertest')
const lolex = require('lolex')
const { migrateAndStartServer, startServer, app, server } = require('../bin/server')

const UserAccountRole = require('../app/models/userAccount/userRoleModel')
const { generateJwtToken, insertDefaultRolesAndAdmin } = require('./userAccountHelpers')

const initializeApi = async(runMigrations) => {
  const startCommand = runMigrations ? migrateAndStartServer : startServer
  await startCommand()
  const api = supertest(app)
  return api
}

const closeApi = () => {
  server.close()
}

const getJwtToken = async(db) => {
  await UserAccountRole.removeAll(db)
  const user = await insertDefaultRolesAndAdmin(db)
  const token = await generateJwtToken(user)
  const jwtToken = `Bearer ${token}`
  return jwtToken
}

const responseCommon404 = { message: 'Not Found' }

let fakeClock
const setClockDate = dateString => {
  fakeClock = lolex.install({
    now: new Date(dateString),
    toFake: ['Date']
  })
}
const uninstallClock = () => fakeClock && fakeClock.uninstall()

const initializeTests = async(db, currentDate) => {
  currentDate && setClockDate(currentDate)
  const api = await initializeApi()
  const jwtToken = await getJwtToken(db)
  return {
    api,
    jwtToken
  }
}

const cleanupTests = () => {
  closeApi()
  uninstallClock()
}

module.exports = {
  initializeTests,
  cleanupTests,
  initializeApi,
  closeApi,
  getJwtToken,
  responseCommon404,
  setClockDate,
  uninstallClock
}
