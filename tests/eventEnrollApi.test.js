const lolex = require('lolex')
const moment = require('moment')
const { db } = require('../db/pgp')
const { initializeApi, closeApi, getJwtToken } = require('./testHelpers')

const {
  insertInitialEventEnrolls,
  insertEnrolls,
  eventEnrollsInDb,
  eventEnrollsInDbByEvent,
  removeAllFromDb } = require('./eventEnrollHelpers')
const { insertInitialEvents, removeAllFromDb: removeAllEventsFromDb } = require('./eventHelpers')

let api
let jwtToken
let eventId = 1
let complexEventId = 2
let responseInvalidEnrollId = { message: 'Event enroll id must be integer' }
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

    describe('Table event_enroll has values', async () => {
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

      describe(`Enrolling to an event`, async () => {
        test('POST /api/events/:complexEventId/enrolls creates new eventEnroll', async () => {
          const eventEnrollsAtStart = await eventEnrollsInDb(db)
          const newEventEnroll = {
            values: {
              etunimi: 'Name',
              radio: 'option-a'
            }
          }
          const response = await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(newEventEnroll)
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const eventEnrollsAfter = await eventEnrollsInDb(db)
          expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length + 1)
          const newDbEntry = eventEnrollsAfter[eventEnrollsAfter.length - 1]

          expect(response.body).toEqual(newDbEntry)
        })
        test('POST /api/events/:complexEventId/enrolls can not enroll when event is full', async () => {
          const dummyEnrolls = [
            { values: { etunimi: 'Name1', radio: 'option-a' } },
            { values: { etunimi: 'Name2', radio: 'option-a' } },
            { values: { etunimi: 'Name3', radio: 'option-a' } },
            { values: { etunimi: 'Name4', radio: 'option-b' } }
          ]
          const response400 = {
            message: 'Event is full'
          }
          // Event with id 2 has maxParticipant limit of 3 one event previously inserted and 1 reserve
          await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[0])
            .expect(201)
          await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[1])
            .expect(201)
          await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[2])
            .expect(201)

          const eventEnrollsAtStart = await eventEnrollsInDb(db)

          // Fourth enroll should fail
          const response = await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[1])
            .expect(400)
            .expect('Content-Type', /application\/json/)

          const eventEnrollsAfter = await eventEnrollsInDb(db)
          expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length)

          expect(response.body).toEqual(response400)
        })
        test('POST /api/events/:complexEventId/enrolls creates spare enrollment when event max limit reached', async () => {
          const dummyEnrolls = [
            { values: { etunimi: 'Name1', radio: 'option-a' } },
            { values: { etunimi: 'Name2', radio: 'option-a' } },
            { values: { etunimi: 'Name3', radio: 'option-a' } }
          ]
          // Event with id 2 has maxParticipant limit of 3 and one event with option-a previously inserted
          await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[0])
            .expect(201)
          await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[1])
            .expect(201)

          const eventEnrollsAtStart = await eventEnrollsInDb(db)
          const epxectedEnroll = {
            id: 6,
            eventId: 2,
            isSpare: true,
            createdAt: currentDate,
            values: {
              etunimi: 'Name3',
              radio: 'option-a'
            }
          }
          const response = await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[2])
            .expect(201)
            .expect('Content-Type', /application\/json/)

          const eventEnrollsAfter = await eventEnrollsInDb(db)
          expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length + 1)

          expect(response.body).toEqual(epxectedEnroll)
        })
      })

      test('POST /api/intra/events/:eventId/enrolls with invalid input should return status 400', async () => {
        const eventEnrollsAtStart = await eventEnrollsInDb(db)
        const invalidNewEventEnroll = {
          values: {
            etunimi: null,
            sukunimi: '',
            notExistingField: 'Nothing'
          }
        }
        const response400 = {
          message: 'Validation error',
          validationErrors: [
            {
              location: 'body',
              msg: 'vaaditaan',
              param: 'values.etunimi',
              value: null
            },
            {
              location: 'body',
              msg: 'vaaditaan',
              param: 'values.sukunimi',
              value: ''
            },
            {
              location: 'body',
              msg: 'Tuntematon kenttä',
              param: 'values.notExistingField',
              value: 'Nothing'
            }
          ]
        }
        const response = await api.post(`/api/intra/events/${eventId}/enrolls`)
          .set('Authorization', jwtToken)
          .send(invalidNewEventEnroll)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        const eventEnrollsAfter = await eventEnrollsInDb(db)
        expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length)

        expect(response.body).toEqual(response400)
      })

      test('POST /api/intra/events/:eventId/enrolls with too long input string should return status 400', async () => {
        const eventEnrollsAtStart = await eventEnrollsInDb(db)
        const invalidNewEventEnroll = {
          values: {
            etunimi: 'regular string',
            sukunimi: 'this is way longer string than accepted on event definition'
          }
        }
        const response400 = {
          message: 'Validation error',
          validationErrors: [
            {
              location: 'body',
              msg: 'liian monta merkkiä',
              param: 'values.sukunimi',
              value: 'this is way longer string than accepted on event definition'
            }
          ]
        }
        const response = await api.post(`/api/intra/events/${eventId}/enrolls`)
          .set('Authorization', jwtToken)
          .send(invalidNewEventEnroll)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        const eventEnrollsAfter = await eventEnrollsInDb(db)
        expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length)

        expect(response.body).toEqual(response400)
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

        describe('Event enroll manipulation', async () => {
          test('POST /api/intra/events/:eventId/enrolls creates new eventEnroll', async () => {
            const eventEnrollsAtStart = await eventEnrollsInDb(db)
            const newEventEnroll = {
              values: {
                etunimi: 'First name',
                sukunimi: 'Surname'
              }
            }
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
          test('DELETE /api/intra/events/:complexEventId/enrolls updates last spare enroll', async () => {
            // "Complex" event 2 has one existing enroll with radio option-a 
            // maxParticipant is 3 and reserve count 1
            // option-a has reserve 2 and option-b reserve 1
            // By removing second option-a entry the isSpare of last one should be false after operation
            const dummyEnrolls = [
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('5', 'minutes').format(),
                  updatedAt: null,
                  isSpare: false,
                  values: {
                    etunimi: 'Name1',
                    radio: 'option-a'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('10', 'minutes').format(),
                  updatedAt: null,
                  isSpare: false,
                  values: {
                    etunimi: 'Name2',
                    radio: 'option-a'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('15', 'minutes').format(),
                  updatedAt: null,
                  isSpare: false,
                  values: {
                    etunimi: 'Name2',
                    radio: 'option-b'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('20', 'minutes').format(),
                  updatedAt: null,
                  isSpare: true,
                  values: {
                    etunimi: 'Name3',
                    radio: 'option-a'
                  }
                }
              }
            ]
            await insertEnrolls(db, dummyEnrolls)

            const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, complexEventId)
            const deletedEventEnroll = eventEnrollsAtStart[1]
            await api.delete(`/api/intra/events/${complexEventId}/enrolls/${deletedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .expect(204)
            const eventEnrollsAfter = await eventEnrollsInDbByEvent(db, complexEventId)
            expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length - 1)
            expect(eventEnrollsAfter).not.toContainEqual(deletedEventEnroll)

            const spareToNormalEnroll = eventEnrollsAfter[3]
            const expectedUpdatedEnroll = {
              id: 7,
              isSpare: false,
              createdAt: moment(currentDate).add('20', 'minutes').format(),
              eventId: complexEventId,
              values: {
                etunimi: 'Name3',
                radio: 'option-a'
              }
            }
            expect(spareToNormalEnroll).toMatchObject(expectedUpdatedEnroll)
          })
          test('DELETE /api/intra/events/:complexEventId/enrolls does not update last spare enroll when other not limited field enroll is deleted from between', async () => {
            const dummyEnrolls = [
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('5', 'minutes').format(),
                  updatedAt: null,
                  isSpare: false,
                  values: {
                    etunimi: 'Name1',
                    radio: 'option-a'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('10', 'minutes').format(),
                  updatedAt: null,
                  isSpare: false,
                  values: {
                    etunimi: 'Name2',
                    radio: 'option-a'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('15', 'minutes').format(),
                  updatedAt: null,
                  isSpare: false,
                  values: {
                    etunimi: 'Name2',
                    radio: 'option-b'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('20', 'minutes').format(),
                  updatedAt: null,
                  isSpare: true,
                  values: {
                    etunimi: 'Name3',
                    radio: 'option-a'
                  }
                }
              }
            ]
            await insertEnrolls(db, dummyEnrolls)

            const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, complexEventId)
            const deletedEventEnroll = eventEnrollsAtStart[3] // option-b
            await api.delete(`/api/intra/events/${complexEventId}/enrolls/${deletedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .expect(204)
            const eventEnrollsAfter = await eventEnrollsInDbByEvent(db, complexEventId)
            expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length - 1)
            expect(eventEnrollsAfter).not.toContainEqual(deletedEventEnroll)

            const spareToNormalEnroll = eventEnrollsAfter[3]
            const expectedUpdatedEnroll = {
              id: 7,
              isSpare: true,
              createdAt: moment(currentDate).add('20', 'minutes').format(),
              eventId: complexEventId,
              values: {
                etunimi: 'Name3',
                radio: 'option-a'
              }
            }
            expect(spareToNormalEnroll).toMatchObject(expectedUpdatedEnroll)
          })
        })
      })
    })
  })
})