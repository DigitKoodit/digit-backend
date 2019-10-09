
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')
const { insertInitialNavItems, navItemsInDb, removeAllFromDb } = require('./navItemHelpers')
let api
let jwtToken
const responseInvalidNavItemId = { message: 'Nav item id must be integer' }
const getPublished = true

beforeAll(async () => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)
})

afterAll(() => {
  closeApi()
})

describe('Navigation API', async () => {
  beforeAll(async () => {
    await removeAllFromDb(db)
  })

  describe('User is not authenticated', async () => {
    test('GET /api/intra/navigation should return status 401', async () => {
      return api.get('/api/intra/navigation')
        .expect(401)
    })
    test('GET /api/intra/navigation should return status 200 and values', async () => {
      const navItemsAtStart = await navItemsInDb(db, getPublished)
      const response = await api.get('/api/navigation')
        .expect(200)
        .expect('Content-Type', /application\/json/)

      expect(response.body.length).toBe(navItemsAtStart.length)
      expect(response.body).toEqual(expect.arrayContaining(navItemsAtStart))
    })
  })

  describe('User is authenticated', async () => {
    describe('Authorized but invalid request params', async () => {
      test('GET /api/intra/navigation/:invalidNavItemId should return status 400', async () => {
        const invalidNavItemId = 'INVALID_ID'
        const response = await api.get(`/api/intra/navigation/${invalidNavItemId}`)
          .set('Authorization', jwtToken)
          .expect(400)

        expect(response.body).toEqual(responseInvalidNavItemId)
      })
    })

    describe('Table navItem is empty', async () => {
      test('GET /api/intra/navigation should return status 200 and empty array', async () => {
        const response = await api.get('/api/intra/navigation')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('Table navItem has values', async () => {
      beforeEach(async () => {
        await removeAllFromDb(db)
        await insertInitialNavItems(db)
      })

      test('GET /api/intra/navigation should return status 200 and values', async () => {
        const navItemsAtStart = await navItemsInDb(db)
        const response = await api.get('/api/intra/navigation')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body.length).toBe(navItemsAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(navItemsAtStart))
      })

      describe('Navigation manipulation', async () => {
        test('POST /api/intra/navigation creates new navItem', async () => {
          const navItemsAtStart = await navItemsInDb(db)
          const newNavItem = {
            sitePageId: null,
            parentId: null,
            path: '/new',
            title: 'New',
            isCustom: false,
            weight: 0,
            showOnNavigation: true,
            isPublished: true,
            isEmphasized: false
          }
          const response = await api.post('/api/intra/navigation')
            .set('Authorization', jwtToken)
            .send(newNavItem)
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const navItemsAfter = await navItemsInDb(db)
          expect(navItemsAfter.length).toBe(navItemsAtStart.length + 1)
          const newDbEntry = navItemsAfter[navItemsAfter.length - 1]

          expect(response.body).toEqual(newDbEntry)

        })
        test('PUT /api/intra/navigation updates existing navItem', async () => {
          const navItemsAtStart = await navItemsInDb(db)
          const updatedEntryIndex = 0
          const updatedFirstNavItem = {
            ...navItemsAtStart[updatedEntryIndex],
            sitePageId: null,
            parentId: null,
            path: '/updated',
            title: 'Updated',
            isCustom: false,
            weight: 0,
            showOnNavigation: true,
            isPublished: true,
            isEmphasized: false
          }

          const response = await api.put(`/api/intra/navigation/${updatedFirstNavItem.id}`)
            .set('Authorization', jwtToken)
            .send(updatedFirstNavItem)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          const navItemsAfter = await navItemsInDb(db)
          expect(navItemsAfter.length).toBe(navItemsAtStart.length)
          const updatedEntry = navItemsAfter[updatedEntryIndex]

          expect(response.body).toEqual(updatedEntry)
        })

        test('DELETE /api/intra/navigation delete navItem return 204', async () => {
          const navItemsAtStart = await navItemsInDb(db)
          const deletedNavItem = navItemsAtStart[0]
          await api.delete(`/api/intra/navigation/${deletedNavItem.id}`)
            .set('Authorization', jwtToken)
            .expect(204)
          const navItemsAfter = await navItemsInDb(db)
          expect(navItemsAfter.length).toBe(navItemsAtStart.length - 1)
          expect(navItemsAfter).not.toContainEqual(deletedNavItem)
        })
      })
    })
  })
})