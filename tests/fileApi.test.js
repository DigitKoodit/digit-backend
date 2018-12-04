const supertest = require('supertest')
const path = require('path')
const { startServer, migrateAndStartServer, app, server } = require('../bin/server')
const { db, pgp } = require('../db/pgp')

const UserAccount = require('../app/models/userAccount/userAccountModel')
const UserAccountRole = require('../app/models/userAccount/userRoleModel')
const { generateJwtToken, insertDefaultRolesAndAdmin } = require('./userAccountHelpers')
const File = require('../app/models/file/fileModel')
const { insertInitialFiles, filesInDb, clearUploadsTestFolder } = require('./fileHelpers')

let api
let jwtToken

beforeAll(() => {
  //   return migrateAndStartServer() // Switch with startServer if new migrations available
  // TODO: run migrations automatically if not up to date
  return startServer()
    .then(() => {
      api = supertest(app)
      return UserAccountRole.removeAll(db)
        .then(() => insertDefaultRolesAndAdmin(db))
    })
    .then(generateJwtToken)
    .then(token => {
      jwtToken = `Bearer ${token}`
    })
})

afterAll(() => {
  server.close()
})

describe('File API', async () => {
  beforeAll(async () => {
    await File.removeAll(db)
  })

  describe('user is not authenticated', async () => {
    it('GET /api/intra/files should return status 401', async () => {
      return api.get('/api/intra/files')
        .expect(401)
    })
  })

  describe('user is authenticated', async () => {
    describe('file table is empty', async () => {
      it('GET /api/intra/files should return status 200 and empty array', async () => {
        const response = await api.get('/api/intra/files')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('file table has values', async () => {
      beforeAll(async () => {
        await insertInitialFiles(db)
      })
      it('GET /api/intra/files should return status 200 and values', async () => {
        const filesAtStart = await filesInDb(db)
        const response = await api.get('/api/intra/files')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body.length).toEqual(filesAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(filesAtStart))
      })

      describe('file upload', async () => {
        afterEach(async () => {
          await clearUploadsTestFolder()
        })
        // Multiple files can be uploaded simultaneously therefore response.body is array
        it('POST /api/intra/files/uploads uploads file to uploads_test folder', async () => {
          const filesAtStart = await filesInDb(db)
          const testFilePath = path.join(__dirname, 'assets', 'suomi_talvella.jpg')
          const response = await api.post('/api/intra/files/uploads')
            .set('Authorization', jwtToken)
            .attach('uploads', testFilePath)
            .expect(201)
          const filesAfter = await filesInDb(db)
          expect(filesAtStart.length + 1).toEqual(filesAfter.length)
          const newDbEntry = filesAfter[filesAfter.length - 1]
          expect(response.body).toEqual([newDbEntry])

        })
      })
    })
  })
})
