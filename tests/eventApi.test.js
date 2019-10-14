
const lolex = require('lolex')
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')
const { insertInitialEvents, eventsInDb, removeAllFromDb } = require('./eventHelpers')
let api
let jwtToken
const responseInvalidEventId = { message: 'Event id must be integer' }
const responseSingmeEventNotFound = { message: 'Event not found' }
let currentDate = '2019-01-30T12:00:00+02:00'

let fakeClock
const setDate = dateString => {
  fakeClock = lolex.install({
    now: new Date(dateString),
    toFake: ['Date']
  })
}

beforeAll(async () => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)
  setDate(currentDate)
})

afterAll(() => {
  closeApi()
  fakeClock.uninstall()
})

describe('Event API', () => {
  beforeEach(async () => {
    // Truncates event table which removes enrolls too
    await removeAllFromDb(db)
  })

  describe('Invalid request params', () => {
    test('GET /api/events/:invalidEventId should return status 400', async () => {
      const invalidEventId = 'INVALID_ID'
      const response = await api.get(`/api/events/${invalidEventId}`)
        .expect(400)
      expect(response.body).toEqual(responseInvalidEventId)
    })
  })

  describe('Request events with limited visibility', () => {
    beforeEach(async () => {
      // await removeAllFromDb(db)
      await insertInitialEvents(db)
    })

    test('GET /api/events/:completelyHiddenEventId should return status 404', async () => {
      const completelyHiddenEventId = 3
      const response = await api.get(`/api/events/${completelyHiddenEventId}`)
        .expect(404)
      expect(response.body).toEqual(responseSingmeEventNotFound)
    })

    test('GET /api/events/:visibleNotPublicEventId should return status event', async () => {
      const eventsAtStart = await eventsInDb(db)
      console.log(eventsAtStart)
      const visibleNotPublicEventId = 4
      const response = await api.get(`/api/events/${visibleNotPublicEventId}`)
        .expect(200)
      expect(response.body).toEqual(eventsAtStart[3])
    })

    test('GET /api/events/:publicNotVisibleEventId should return status event', async () => {
      const eventsAtStart = await eventsInDb(db)
      const publicNotVisibleEventId = 5
      const response = await api.get(`/api/events/${publicNotVisibleEventId}`)
        .expect(200)
      expect(response.body).toEqual(eventsAtStart[4])
    })
  })

  describe('User is not authenticated', () => {
    test('GET /api/intra/events should return status 401', async () => {
      api.get('/api/intra/events')
        .expect(401)
    })
  })

  describe('User is authenticated', () => {

    describe('Authorized but invalid request params', () => {
      test('GET /api/intra/events/:invalidEventId should return status 400', async () => {
        const invalidEventId = 'INVALID_ID'
        const response = await api.get(`/api/intra/events/${invalidEventId}`)
          .set('Authorization', jwtToken)
          .expect(400)
        expect(response.body).toEqual(responseInvalidEventId)
      })
    })

    describe('Table event is empty', () => {
      test('GET /api/intra/events should return status 200 and empty array', async () => {
        const response = await api.get('/api/intra/events')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(response.body).toEqual([])
      })
    })

    describe('Table event has values', () => {
      beforeEach(async () => {
        // await removeAllFromDb(db)
        await insertInitialEvents(db)
      })

      test('GET /api/intra/events should return status 200 and values', async () => {
        const eventsAtStart = await eventsInDb(db)
        const response = await api.get('/api/intra/events')
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body.length).toBe(eventsAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(eventsAtStart))
      })

      describe('Event manipulation', () => {
        test('POST /api/intra/events creates new event', async () => {
          const eventsAtStart = await eventsInDb(db)
          const newEvent = {
            name: 'New event',
            description: 'Fancy description',
            fields: [
              {
                id: 0,
                name: 'Checking',
                label: 'Checkboxes',
                fieldName: 'Valintaruudut',
                type: 'checkbox',
                required: true,
                public: true,
                order: 0,
                options: [
                  {
                    name: 'Option',
                    label: 'Valinta',
                    isDefault: true,
                    value: false,
                    maxParticipants: null,
                    reserveCount: null
                  }
                ],
              }
            ],
            activeUntil: '2019-01-22T13:00:00+02:00',
            activeAt: '2019-02-22T13:00:00+02:00',
            isVisible: true,
            isPublished: true,
            maxParticipants: 30,
            reserveCount: 20
          }
          const response = await api.post('/api/intra/events')
            .set('Authorization', jwtToken)
            .send(newEvent)
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const eventsAfter = await eventsInDb(db)
          expect(eventsAfter.length).toBe(eventsAtStart.length + 1)
          const newDbEntry = eventsAfter[eventsAfter.length - 1]

          expect(response.body).toEqual(newDbEntry)

        })
        test('PUT /api/intra/events updates existing event', async () => {
          const eventsAtStart = await eventsInDb(db)
          const updatedEntryIndex = 0
          const updatedFirstEvent = {
            ...eventsAtStart[updatedEntryIndex],
            fields: [
              {
                id: 0,
                name: 'Checking',
                label: 'Checkboxes',
                fieldName: 'Valintaruudut',
                type: 'checkbox',
                required: true,
                public: true,
                order: 0,
                options: [
                  {
                    name: 'Option',
                    label: 'Valinta',
                    isDefault: true,
                    value: false,
                    reserveCount: null
                  }
                ]
              },
              {
                id: 1,
                name: 'sähköposti',
                label: 'Sähköposti',
                type: 'text',
                placeholder: null,
                maxLength: 64,
                isTextarea: false,
                fieldName: 'Teksti',
                required: true,
                public: true,
                order: 1
              }

            ],
            activeUntil: '2019-01-22T13:00:00+02:00',
            activeAt: '2019-02-22T13:00:00+02:00',
            isVisible: true,
            isPublished: true,
            maxParticipants: 100,
            reserveCount: 50
          }
          const response = await api.put(`/api/intra/events/${updatedFirstEvent.id}`)
            .set('Authorization', jwtToken)
            .send(updatedFirstEvent)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          const eventsAfter = await eventsInDb(db)
          expect(eventsAfter.length).toBe(eventsAtStart.length)
          const updatedEntry = eventsAfter[updatedEntryIndex]

          expect(response.body).toEqual(updatedEntry)
        })

        test('DELETE /api/intra/events delete event return 204', async () => {
          const eventsAtStart = await eventsInDb(db)
          const deletedEvent = eventsAtStart[0]
          await api.delete(`/api/intra/events/${deletedEvent.id}`)
            .set('Authorization', jwtToken)
            .expect(204)
          const eventsAfter = await eventsInDb(db)
          expect(eventsAfter.length).toBe(eventsAtStart.length - 1)
          expect(eventsAfter).not.toContainEqual(deletedEvent)
        })
      })
    })
  })
})