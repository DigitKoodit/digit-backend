
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')
const { insertInitialSitePages, sitePagesInDb, removeAllFromDb } = require('./sitePageHelpers')
let api
let jwtToken
const responseInvalidSitePageId = { message: 'Page id must be integer' }

beforeAll(async() => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)
})

afterAll(() => {
  closeApi()
})

describe('Site page API', () => {
  beforeAll(async() => {
    await removeAllFromDb(db)
  })

  describe('Invalid request params', () => {
    test('GET /api/pages/:invalidSitePageId should return status 400', async() => {
      const invalidSitePageId = 'INVALID_ID'
      const response = await api.get(`/api/pages/${invalidSitePageId}`)
        .expect(400)

      expect(response.body).toEqual(responseInvalidSitePageId)
    })
  })

  describe('User is not authenticated', () => {
    test('GET /api/intra/pages should return status 401', async(done) => {
      api.get('/api/intra/pages')
        .expect(401)
        .end(done)
    })
  })

  describe('User is authenticated', () => {
    describe('Authorized but invalid request params', () => {
      test('GET /api/intra/pages/:invalidSitePageId should return status 400', async() => {
        const invalidSitePageId = 'INVALID_ID'
        const response = await api.get(`/api/intra/pages/${invalidSitePageId}`)
          .set('Authorization', jwtToken)
          .expect(400)

        expect(response.body).toEqual(responseInvalidSitePageId)
      })
    })

    describe('Table sitePage is empty', () => {
      test('GET /api/intra/pages should return status 200 and empty array', async() => {
        const response = await api.get('/api/intra/pages')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('Table sitePage has values', () => {
      beforeEach(async() => {
        await removeAllFromDb(db)
        await insertInitialSitePages(db)
      })

      test('GET /api/intra/pages should return status 200 and values', async() => {
        const sitePagesAtStart = await sitePagesInDb(db)
        const response = await api.get('/api/intra/pages')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body.length).toBe(sitePagesAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(sitePagesAtStart))
      })

      describe('SitePage manipulation', () => {
        test('POST /api/intra/pages creates new sitePage', async() => {
          const sitePagesAtStart = await sitePagesInDb(db)
          const newSitePage = {
            title: 'Page title',
            description: 'Description',
            isHidden: false,
            content: 'New content'
          }
          const response = await api.post('/api/intra/pages')
            .set('Authorization', jwtToken)
            .send(newSitePage)
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const sitePagesAfter = await sitePagesInDb(db)
          expect(sitePagesAfter.length).toBe(sitePagesAtStart.length + 1)
          const newDbEntry = sitePagesAfter[sitePagesAfter.length - 1]

          expect(response.body).toEqual(newDbEntry)
        })
        test('PUT /api/intra/pages/:sitePageId updates existing sitePage', async() => {
          const sitePagesAtStart = await sitePagesInDb(db)
          const updatedEntryIndex = 0
          const updatedFirstSitePage = {
            ...sitePagesAtStart[updatedEntryIndex],
            title: 'Updated title',
            description: 'Updated Description',
            isHidden: true,
            content: 'Updated content'
          }

          const response = await api.put(`/api/intra/pages/${updatedFirstSitePage.id}`)
            .set('Authorization', jwtToken)
            .send(updatedFirstSitePage)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          const sitePagesAfter = await sitePagesInDb(db)
          expect(sitePagesAfter.length).toBe(sitePagesAtStart.length)
          const updatedEntry = sitePagesAfter[updatedEntryIndex]

          expect(response.body).toEqual(updatedEntry)
        })

        test('DELETE /api/intra/pages delete sitePage return 204', async() => {
          const sitePagesAtStart = await sitePagesInDb(db)
          const deletedSitePage = sitePagesAtStart[0]
          await api.delete(`/api/intra/pages/${deletedSitePage.id}`)
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
