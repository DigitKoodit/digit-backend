const supertest = require('supertest')
const path = require('path')
const { startServer, app, server } = require('../bin/server')
const { db } = require('../db/pgp')

const UserAccountRole = require('../app/models/userAccount/userRoleModel')
const { generateJwtToken, insertDefaultRolesAndAdmin } = require('./userAccountHelpers')
const { insertInitialFiles, filesInDb, removeAllFromDb, clearUploadsTestFolder } = require('./fileHelpers')

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
    await removeAllFromDb(db)
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
        expect(response.body.length).toBe(filesAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(filesAtStart))
      })

      describe('file upload', async () => {
        afterEach(async () => {
          await clearUploadsTestFolder()
        })
        // Multiple files can be uploaded simultaneously therefore response returns created files in an array
        it('POST /api/intra/files/uploads uploads file to uploads_test folder', async () => {
          const filesAtStart = await filesInDb(db)
          const testFilePath = path.join(__dirname, 'assets', 'suomi_talvella.jpg')
          const response = await api.post('/api/intra/files/uploads')
            .set('Authorization', jwtToken)
            .attach('uploads', testFilePath)
            .expect(201)

          const filesAfter = await filesInDb(db)
          expect(filesAfter.length).toBe(filesAtStart.length + 1)
          const newDbEntry = filesAfter[filesAfter.length - 1]
          expect(response.body).toContainEqual(newDbEntry)
        })
      })

      it('PUT /api/intra/files update file description return 200 and updated value', async () => {
        const filesAtStart = await filesInDb(db)
        const updatedFirstFile = {
          ...filesAtStart[0],
          description: 'Päivitetyt lisätiedot tiedostolle'
        }
        const response = await api.put(`/api/intra/files/${updatedFirstFile.id}`)
          .send(updatedFirstFile)
          .set('Authorization', jwtToken)
          .expect(200)
        expect(response.body.description).toBe(updatedFirstFile.description)
      })

      it('DELETE /api/intra/files delete file return 204', async () => {
        const filesAtStart = await filesInDb(db)
        const deletedFile = filesAtStart[0]
        await api.delete(`/api/intra/files/${deletedFile.id}`)
          .set('Authorization', jwtToken)
          .expect(204)
        const filesAfter = await filesInDb(db)
        expect(filesAfter.length).toBe(filesAtStart.length - 1)
        expect(filesAfter).not.toContainEqual(deletedFile)
      })
    })
  })
})
