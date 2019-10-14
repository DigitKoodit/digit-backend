const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')
const path = require('path')

const { insertInitialFiles, filesInDb, removeAllFromDb, clearUploadsTestFolder } = require('./fileHelpers')

let api
let jwtToken

beforeAll(async() => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)
})

afterAll(() => {
  closeApi()
})

describe('File API', () => {
  beforeAll(async() => {
    await removeAllFromDb(db)
  })

  describe('User is not authenticated', () => {
    test('GET /api/intra/files should return status 401', () => {
      api.get('/api/intra/files')
        .expect(401)
    })
  })

  describe('user is authenticated', () => {
    describe('Table file is empty', () => {
      test('GET /api/intra/files should return status 200 and empty array', async() => {
        const response = await api.get('/api/intra/files')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('Table file has values', () => {
      beforeAll(async() => {
        await insertInitialFiles(db)
      })

      test('GET /api/intra/files should return status 200 and values', async() => {
        const filesAtStart = await filesInDb(db)
        const response = await api.get('/api/intra/files')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body.length).toBe(filesAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(filesAtStart))
      })

      describe('File upload', () => {
        afterEach(async() => {
          await clearUploadsTestFolder()
        })
        // Multiple files can be uploaded simultaneously therefore response returns created files in an array
        test('POST /api/intra/files/uploads uploads file to uploads_test folder', async() => {
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

      test('PUT /api/intra/files update file description return 200 and updated value', async() => {
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

      test('DELETE /api/intra/files delete file return 204', async() => {
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
