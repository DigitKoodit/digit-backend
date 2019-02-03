
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')
const { insertInitialSitePages, sitePagesInDb, removeAllFromDb } = require('./sitePageHelpers')
let api
let jwtToken
const responseInvalidSitePageId = { message: 'Page id must be integer' }

beforeAll(async () => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)
})

afterAll(() => {
  closeApi()
})

describe('Site page API', async () => {
  beforeAll(async () => {
    await removeAllFromDb(db)
  })

  describe('Invalid request params', async () => {
    test('GET /api/contents/:invalidSitePageId should return status 400', async () => {
      const invalidSitePageId = 'INVALID_ID'
      const response = await api.get(`/api/contents/${invalidSitePageId}`)
        .expect(400)

      expect(response.body).toEqual(responseInvalidSitePageId)
    })
  })

  describe('User is not authenticated', async () => {
    test('GET /api/intra/contents should return status 401', async () => {
      return api.get('/api/intra/contents')
        .expect(401)
    })
  })

  describe('User is authenticated', async () => {
    describe('Authorized but invalid request params', async () => {
      test('GET /api/intra/contents/:invalidSitePageId should return status 400', async () => {
        const invalidSitePageId = 'INVALID_ID'
        const response = await api.get(`/api/intra/contents/${invalidSitePageId}`)
          .set('Authorization', jwtToken)
          .expect(400)

        expect(response.body).toEqual(responseInvalidSitePageId)
      })
    })

    describe('Table sitePage is empty', async () => {
      test('GET /api/intra/contents should return status 200 and empty array', async () => {
        const response = await api.get('/api/intra/contents')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('Table sitePage has values', async () => {
      beforeEach(async () => {
        await removeAllFromDb(db)
        await insertInitialSitePages(db)
      })

      test('GET /api/intra/contents should return status 200 and values', async () => {
        const sitePagesAtStart = await sitePagesInDb(db)
        const response = await api.get('/api/intra/contents')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body.length).toBe(sitePagesAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(sitePagesAtStart))
      })

      describe('SitePage manipulation', async () => {
        test('POST /api/intra/contents creates new sitePage', async () => {
          const sitePagesAtStart = await sitePagesInDb(db)
          const newSitePage = {
            title: 'Page title',
            description: 'Description',
            published: true,
            content: 'New content'
          }
          const response = await api.post('/api/intra/contents')
            .set('Authorization', jwtToken)
            .send(newSitePage)
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const sitePagesAfter = await sitePagesInDb(db)
          expect(sitePagesAfter.length).toBe(sitePagesAtStart.length + 1)
          const newDbEntry = sitePagesAfter[sitePagesAfter.length - 1]

          expect(response.body).toEqual(newDbEntry)

        })
        test('PUT /api/intra/contents/:sitePageId updates existing sitePage', async () => {
          const sitePagesAtStart = await sitePagesInDb(db)
          const updatedEntryIndex = 0
          const updatedFirstSitePage = {
            ...sitePagesAtStart[updatedEntryIndex],
            title: 'Updated title',
            description: 'Updated Description',
            published: false,
            content: 'Updated content'
          }

          const response = await api.put(`/api/intra/contents/${updatedFirstSitePage.id}`)
            .set('Authorization', jwtToken)
            .send(updatedFirstSitePage)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          const sitePagesAfter = await sitePagesInDb(db)
          expect(sitePagesAfter.length).toBe(sitePagesAtStart.length)
          const updatedEntry = sitePagesAfter[updatedEntryIndex]

          expect(response.body).toEqual(updatedEntry)
        })

        test('DELETE /api/intra/contents delete sitePage return 204', async () => {
          const sitePagesAtStart = await sitePagesInDb(db)
          const deletedSitePage = sitePagesAtStart[0]
          await api.delete(`/api/intra/contents/${deletedSitePage.id}`)
            .set('Authorization', jwtToken)
            .expect(204)
          const sitePagesAfter = await sitePagesInDb(db)
          expect(sitePagesAfter.length).toBe(sitePagesAtStart.length - 1)
          expect(sitePagesAfter).not.toContainEqual(deletedSitePage)
        })
      })
    })
  })
})