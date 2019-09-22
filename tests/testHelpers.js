const supertest = require('supertest')
const { migrateAndStartServer, startServer, app, server } = require('../bin/server')

const UserAccountRole = require('../app/models/userAccount/userRoleModel')
const { generateJwtToken, insertDefaultRolesAndAdmin } = require('./userAccountHelpers')

const initializeApi = async (runMigrations) => {
  const startCommand = runMigrations ? migrateAndStartServer : startServer
  await startCommand()
  api = supertest(app)
  return api
}

const closeApi = () => {
  server.close()
}

const getJwtToken = async (db) => {
  await UserAccountRole.removeAll(db)
  const user = await insertDefaultRolesAndAdmin(db)
  const token = await generateJwtToken(user)
  const jwtToken = `Bearer ${token}`
  console.log('TOKEN SET')
  return jwtToken
}
const responseCommon404 = { message: 'Not Found' }

module.exports = {
  initializeApi,
  closeApi,
  getJwtToken,
  responseCommon404
}