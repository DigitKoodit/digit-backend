// Just search and replace "eventEnroll" with what ever module you're testing
// Be sure to check api end points
const supertest = require('supertest')
const lolex = require('lolex')
const { startServer, app, server } = require('../bin/server')
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')

const { insertInitialEventEnrolls, eventEnrollsInDb, eventEnrollsInDbByEvent, removeAllFromDb } = require('./eventEnrollHelpers')
const { insertInitialEvents, removeAllFromDb: removeAllEventsFromDb } = require('./eventHelpers')

let api
let jwtToken
let eventId = 1
let responseInvalidEnrollId = { message: 'Event enroll id must be integer' }


beforeAll(async () => {
  api = await initializeApi()
  jwtToken = await getJwtToken(db)

  fakeClock = lolex.install({
    now: new Date('2019-01-31T12:00:00+02:00'), // Set fixed time before event closes and enrolls have occured
    toFake: ['Date']
  })
})

afterAll(() => {
  closeApi()
  fakeClock.uninstall()
})

describe('Event enroll API', async () => {
  beforeAll(async () => {
    // Truncates eventEnroll table which removes eventEnrolls too
    await removeAllFromDb(db)
    await removeAllEventsFromDb(db)
    await insertInitialEvents(db)
  })

  describe('Public API', async () => {
    let getPublic = true

    describe(`Event doesn't exists`, async () => {
      test('GET /api/events/:eventId/enrolls with non existing event id should return status 404', async () => {
        const nonExistingEventId = 10101
        const eventNotFoundResponse = { message: 'Event not found' }
        const response = await api.get(`/api/events/${nonExistingEventId}/enrolls`)
          .expect(404)
        expect(response.body).toEqual(eventNotFoundResponse)
      })
    })

    describe('Event exists but no enrolls', async () => {
      test('GET /api/events/:eventId/enrolls should return status 200 and empty array ', async () => {
        const response = await api.get(`/api/events/${eventId}/enrolls`)
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body.length).toBe(0)
      })
    })

    describe('Table event_enroll values', async () => {
      beforeEach(async () => {
        await removeAllFromDb(db)
        await insertInitialEventEnrolls(db)
      })

      test('GET /api/events/:eventId/enrolls should return status 200 and empty array ', async () => {
        const publicEventEnrollsAtStart = await eventEnrollsInDbByEvent(db, eventId, getPublic)
        const response = await api.get(`/api/events/${eventId}/enrolls`)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body.length).toBe(publicEventEnrollsAtStart.length)
        expect(response.body).toEqual(expect.arrayContaining(publicEventEnrollsAtStart))
      })


      describe(`Trying to enroll to a non existing event`, async () => {
        test('POST /api/events/:eventId/enrolls', async () => {
          const response404Event = { message: 'Event not found' }
          const nonExistingEventId = 10101

          const response = await api.post(`/api/events/${nonExistingEventId}/enrolls`)
            .send({})
            .expect(404)
          expect(response.body).toEqual(response404Event)
        })
      })
    })
  })

  describe('Private API', async () => {
    describe('User is not authenticated', async () => {
      test('GET /api/intra/events/:eventId/enrolls should return status 401', async () => {
        const response = await api.get(`/api/intra/events/${eventId}/enrolls`)
          .expect(401)
      })
    })

    describe('User is authenticated', async () => {

      describe('Authorized but invalid request params', async () => {
        test('PUT /api/intra/events/:eventId/enrolls/:invalidEventEnrollId should return status 400', async () => {
          const invalidEventEnrollId = 'INVALID_ID'
          const response = await api.put(`/api/intra/events/${eventId}/enrolls/${invalidEventEnrollId}`)
            .set('Authorization', jwtToken)
            .expect(400)
          expect(response.body).toEqual(responseInvalidEnrollId)
        })
      })

      describe('Table eventEnroll is empty', async () => {
        beforeEach(async () => {
          await removeAllFromDb(db)
        })
        test('GET /api/intra/events/:eventId/enrolls should return status 200 and empty array', async () => {
          const response = await api.get(`/api/intra/events/${eventId}/enrolls`)
            .set('Authorization', jwtToken)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          expect(response.body).toEqual([])
        })
      })

      describe('Table event_enroll has values', async () => {
        beforeEach(async () => {
          await removeAllFromDb(db)
          await insertInitialEventEnrolls(db)
        })

        test('GET /api/intra/events/:eventId/enrolls should return status 200 and values', async () => {
          const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, eventId)
          const response = await api.get(`/api/intra/events/${eventId}/enrolls`)
            .set('Authorization', jwtToken)
            .expect(200)
            .expect('Content-Type', /application\/json/)
          expect(response.body.length).toBe(eventEnrollsAtStart.length)
          expect(response.body).toEqual(expect.arrayContaining(eventEnrollsAtStart))
        })

        describe('EventEnroll manipulation', async () => {
          test('POST /api/intra/events/:eventId/enrolls creates new eventEnroll', async () => {
            const eventEnrollsAtStart = await eventEnrollsInDb(db)
            const newEventEnroll = {}
            const response = await api.post(`/api/intra/events/${eventId}/enrolls`)
              .set('Authorization', jwtToken)
              .send(newEventEnroll)
              .expect(201)
              .expect('Content-Type', /application\/json/)

            const eventEnrollsAfter = await eventEnrollsInDb(db)
            expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length + 1)
            const newDbEntry = eventEnrollsAfter[eventEnrollsAfter.length - 1]

            expect(response.body).toEqual(newDbEntry)

          })
          test('PUT /api/intra/events/:eventId/enrolls/:eventEnrollId response with 404', async () => {
            const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, eventId)
            const updatedEventEnrollIndex = 0
            const originalEventEnroll = eventEnrollsAtStart[updatedEventEnrollIndex]
            const updatedEventEnroll = {
              ...originalEventEnroll,
              values: {
                ...originalEventEnroll.values,
                etunimi: 'New name'
              }
            }
            const response = await api.put(`/api/intra/events/${updatedEventEnroll.eventId}/enrolls/${updatedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .send(updatedEventEnroll)
              .expect(201)
              .expect('Content-Type', /application\/json/)

            const eventEnrollsAfter = await eventEnrollsInDbByEvent(db, eventId)
            expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length)
            expect(response.body).toEqual(eventEnrollsAfter[updatedEventEnrollIndex])
          })

          test('DELETE /api/intra/events/:eventId/enrolls delete eventEnroll return 204', async () => {
            const eventEnrollsAtStart = await eventEnrollsInDb(db)
            const deletedEventEnroll = eventEnrollsAtStart[0]
            await api.delete(`/api/intra/events/${eventId}/enrolls/${deletedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .expect(204)
            const eventEnrollsAfter = await eventEnrollsInDb(db)
            expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length - 1)
            expect(eventEnrollsAfter).not.toContainEqual(deletedEventEnroll)
          })
        })
      })
    })
  })
})