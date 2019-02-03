
// Copy file and rename "item" to which ever model is being tested
// This file contains basic endpoints and API usecases but might require tweaks and additions
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')
// Remember to create test helper for the model
const { insertInitialItems, itemsInDb, removeAllFromDb } = require('./itemHelpers') 
let api
let jwtToken
const responseInvalidItemId = { message: 'Item id must be integer' }

beforeAll(async () => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)
})

afterAll(() => {
  closeApi()
})

describe('Item API', async () => {
  beforeAll(async () => {
    await removeAllFromDb(db)
  })

  describe('Invalid request params', async () => {
    test('GET /api/contents/items/:invalidItemId should return status 400', async () => {
      const invalidItemId = 'INVALID_ID'
      const response = await api.get(`/api/contents/items/${invalidItemId}`)
        .expect(400)

      expect(response.body).toEqual(responseInvalidItemId)
    })
  })

  describe('User is not authenticated', async () => {
    test('GET /api/intra/items should return status 401', async () => {
      return api.get('/api/intra/items')
        .expect(401)
    })
  })

  describe('User is authenticated', async () => {
    describe('Authorized but invalid request params', async () => {
      test('GET /api/intra/items/:invalidItemId should return status 400', async () => {
        const invalidItemId = 'INVALID_ID'
        const response = await api.get(`/api/intra/items/${invalidItemId}`)
          .set('Authorization', jwtToken)
          .expect(400)

        expect(response.body).toEqual(responseInvalidItemId)
      })
    })

    describe('Table item is empty', async () => {
      test('GET /api/intra/items should return status 200 and empty array', async () => {
        const response = await api.get('/api/intra/items')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('Table item has values', async () => {
      beforeEach(async () => {
        await removeAllFromDb(db)
        await insertInitialItems(db)
      })

      test('GET /api/intra/items should return status 200 and values', async () => {
        const itemsAtStart = await itemsInDb(db)
        const response = await api.get('/api/intra/items')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body.length).toBe(itemsAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(itemsAtStart))
      })

      describe('Item manipulation', async () => {
        test('POST /api/intra/items creates new item', async () => {
          const itemsAtStart = await itemsInDb(db)
          const newItem = {}
          const response = await api.post('/api/intra/items')
            .set('Authorization', jwtToken)
            .send(newItem)
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const itemsAfter = await itemsInDb(db)
          expect(itemsAfter.length).toBe(itemsAtStart.length + 1)
          const newDbEntry = itemsAfter[itemsAfter.length - 1]

          expect(response.body).toEqual(newDbEntry)

        })
        test('PUT /api/intra/items updates existing item', async () => {
          const itemsAtStart = await itemsInDb(db)
          const updatedEntryIndex = 0
          const updatedFirstItem = {
            ...itemsAtStart[updatedEntryIndex]
          }

          const response = await api.put(`/api/intra/items/${updatedFirstItem.id}`)
            .set('Authorization', jwtToken)
            .send(updatedFirstItem)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          const itemsAfter = await itemsInDb(db)
          expect(itemsAfter.length).toBe(itemsAtStart.length)
          const updatedEntry = itemsAfter[updatedEntryIndex]

          expect(response.body).toEqual(updatedEntry)
        })

        test('DELETE /api/intra/items delete item return 204', async () => {
          const itemsAtStart = await itemsInDb(db)
          const deletedItem = itemsAtStart[0]
          await api.delete(`/api/intra/items/${deletedItem.id}`)
            .set('Authorization', jwtToken)
            .expect(204)
          const itemsAfter = await itemsInDb(db)
          expect(itemsAfter.length).toBe(itemsAtStart.length - 1)
          expect(itemsAfter).not.toContainEqual(deletedItem)
        })
      })
    })
  })
})