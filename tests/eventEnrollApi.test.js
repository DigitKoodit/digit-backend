const moment = require('moment')
const { db } = require('../db/pgp')
const { initializeTests, cleanupTests } = require('./testHelpers')

const {
  insertInitialEventEnrolls,
  insertEnrolls,
  eventEnrollsInDb,
  eventEnrollsInDbByEvent,
  removeAllFromDb
} = require('./eventEnrollHelpers')
const { insertInitialEvents, removeAllFromDb: removeAllEventsFromDb } = require('./eventHelpers')
const { updateArrayWithOverrides } = require('../app/helpers/helpers')

let api
let jwtToken
const eventId = 1
const complexEventId = 2
const responseInvalidEnrollId = { message: 'Event enroll id must be integer' }
const currentDate = '2019-01-30T12:00:00+02:00'

beforeAll(async() => {
  const setup = await initializeTests(db, currentDate)
  api = setup.api
  jwtToken = setup.jwtToken
})

afterAll(cleanupTests)

describe('Event enroll API', () => {
  beforeAll(async() => {
    // Truncates eventEnroll table which removes eventEnrolls too
    await removeAllFromDb(db)
    await removeAllEventsFromDb(db)
    await insertInitialEvents(db)
  })

  describe('Public API', () => {
    const getPublic = true

    describe(`Event doesn't exists`, () => {
      test('GET /api/events/:eventId/enrolls with non existing event id should return status 404', async() => {
        const nonExistingEventId = 10101
        const eventNotFoundResponse = { message: 'Event not found' }
        const response = await api.get(`/api/events/${nonExistingEventId}/enrolls`)
          .expect(404)
        expect(response.body).toEqual(eventNotFoundResponse)
      })
    })

    describe('Event exists but no enrolls', () => {
      test('GET /api/events/:eventId/enrolls should return status 200 and empty array ', async() => {
        const response = await api.get(`/api/events/${eventId}/enrolls`)
          .set('Authorization', jwtToken)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body.length).toBe(0)
      })
    })

    describe('Table event_enroll has values', () => {
      beforeEach(async() => {
        await removeAllFromDb(db)
        await insertInitialEventEnrolls(db)
      })

      test('GET /api/events/:eventId/enrolls should return status 200 and empty array ', async() => {
        const publicEventEnrollsAtStart = await eventEnrollsInDbByEvent(db, eventId, getPublic)
        const expectedResults = updateArrayWithOverrides(publicEventEnrollsAtStart, [
          { isSpare: false },
          { isSpare: false }
        ])
        const response = await api.get(`/api/events/${eventId}/enrolls`)
          .expect(200)
          .expect('Content-Type', /application\/json/)
        expect(response.body).toEqual(expect.arrayContaining(expectedResults))
      })

      describe(`Trying to enroll to a non existing event`, () => {
        test('POST /api/events/:eventId/enrolls', async() => {
          const response404Event = { message: 'Event not found' }
          const nonExistingEventId = 10101
          const response = await api.post(`/api/events/${nonExistingEventId}/enrolls`)
            .send({})
            .expect(404)
          expect(response.body).toEqual(response404Event)
        })
      })

      describe(`Enrolling to an event`, () => {
        test('POST /api/events/:complexEventId/enrolls creates new eventEnroll', async() => {
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
        test('POST /api/events/:complexEventId/enrolls can not enroll when event is full', async() => {
          const dummyEnrolls = [
            { values: { etunimi: 'Name1', radio: 'option-a' } },
            { values: { etunimi: 'Name2', radio: 'option-a' } },
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
        test('POST /api/events/:complexEventId/enrolls creates spare enrollment when event max limit reached', async() => {
          const dummyEnrolls = [
            { values: { etunimi: 'Name1', radio: 'option-a' } },
            { values: { etunimi: 'Name2', radio: 'option-a' } }
          ]
          // Event with id 2 has maxParticipant limit of 3 and one event with option-a previously inserted
          await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[0])
            .expect(201)

          const epxectedEnroll = {
            id: 5,
            eventId: complexEventId,
            createdAt: currentDate,
            values: {
              etunimi: 'Name2',
              radio: 'option-a'
            }
          }
          const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, complexEventId, getPublic)
          const expectedResults = updateArrayWithOverrides(eventEnrollsAtStart.concat(epxectedEnroll), [
            { isSpare: false },
            { isSpare: false },
            { isSpare: true }
          ])

          const postResponse = await api.post(`/api/events/${complexEventId}/enrolls`)
            .send(dummyEnrolls[1])
            .expect(201)
            .expect('Content-Type', /application\/json/)

          expect(postResponse.body).toEqual(epxectedEnroll)

          const getResponse = await api.get(`/api/events/${complexEventId}/enrolls`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          expect(getResponse.body).toEqual(expect.arrayContaining(expectedResults))
        })
      })

      test('POST /api/intra/events/:eventId/enrolls with invalid input should return status 400', async() => {
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

      test('POST /api/intra/events/:eventId/enrolls with too long input string should return status 400', async() => {
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

  describe('Private API', () => {
    describe('User is not authenticated', () => {
      test('GET /api/intra/events/:eventId/enrolls should return status 401', async() => {
        await api.get(`/api/intra/events/${eventId}/enrolls`)
          .expect(401)
      })
    })

    describe('User is authenticated', () => {
      describe('Authorized but invalid request params', () => {
        test('PUT /api/intra/events/:eventId/enrolls/:invalidEventEnrollId should return status 400', async() => {
          const invalidEventEnrollId = 'INVALID_ID'
          const response = await api.put(`/api/intra/events/${eventId}/enrolls/${invalidEventEnrollId}`)
            .set('Authorization', jwtToken)
            .expect(400)
          expect(response.body).toEqual(responseInvalidEnrollId)
        })
      })

      describe('Table eventEnroll is empty', () => {
        beforeEach(async() => {
          await removeAllFromDb(db)
        })
        test('GET /api/intra/events/:eventId/enrolls should return status 200 and empty array', async() => {
          const response = await api.get(`/api/intra/events/${eventId}/enrolls`)
            .set('Authorization', jwtToken)
            .expect(200)
            .expect('Content-Type', /application\/json/)

          expect(response.body).toEqual([])
        })
      })

      describe('Table event_enroll has values', () => {
        beforeEach(async() => {
          await removeAllFromDb(db)
          await insertInitialEventEnrolls(db)
        })

        test('GET /api/intra/events/:eventId/enrolls should return status 200 and values', async() => {
          const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, eventId)
          const expectedResults = updateArrayWithOverrides(eventEnrollsAtStart, [
            { isSpare: false },
            { isSpare: false },
            { isSpare: false }
          ])

          const response = await api.get(`/api/intra/events/${eventId}/enrolls`)
            .set('Authorization', jwtToken)
            .expect(200)
            .expect('Content-Type', /application\/json/)
          expect(response.body.length).toBe(eventEnrollsAtStart.length)
          expect(response.body).toEqual(expect.arrayContaining(expectedResults))
        })

        describe('Event enroll manipulation', () => {
          test('POST /api/intra/events/:eventId/enrolls creates new eventEnroll', async() => {
            const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, eventId)
            const newEventEnroll = {
              values: {
                etunimi: 'First name',
                sukunimi: 'Surname'
              }
            }
            const epxectedEnroll = {
              id: 4,
              eventId,
              createdAt: currentDate,
              values: {
                etunimi: 'First name',
                sukunimi: 'Surname'
              }
            }
            const expectedResults = updateArrayWithOverrides(eventEnrollsAtStart.concat(epxectedEnroll), [
              { isSpare: false },
              { isSpare: false },
              { isSpare: false }
            ])

            const response = await api.post(`/api/intra/events/${eventId}/enrolls`)
              .set('Authorization', jwtToken)
              .send(newEventEnroll)
              .expect(201)
              .expect('Content-Type', /application\/json/)

            expect(response.body).toEqual(epxectedEnroll)

            const getResponse = await api.get(`/api/events/${eventId}/enrolls`)
              .expect(200)
              .expect('Content-Type', /application\/json/)

            expect(getResponse.body).toEqual(expect.arrayContaining(expectedResults))
          })
          test('PUT /api/intra/events/:eventId/enrolls/:eventEnrollId response with 404', async() => {
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

          test('DELETE /api/intra/events/:eventId/enrolls delete eventEnroll return 204', async() => {
            const eventEnrollsAtStart = await eventEnrollsInDb(db)
            const deletedEventEnroll = eventEnrollsAtStart[0]
            await api.delete(`/api/intra/events/${eventId}/enrolls/${deletedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .expect(204)
            const eventEnrollsAfter = await eventEnrollsInDb(db)

            expect(eventEnrollsAfter.length).toBe(eventEnrollsAtStart.length - 1)
            expect(eventEnrollsAfter).not.toContainEqual(deletedEventEnroll)
          })
          test('DELETE /api/intra/events/:complexEventId/enrolls updates last spare enroll', async() => {
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
                  values: {
                    etunimi: 'Name1',
                    radio: 'option-a'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('15', 'minutes').format(),
                  updatedAt: null,
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

            const eventEnrollsWithoutDeleted = eventEnrollsAtStart.filter(({ id }) => id !== deletedEventEnroll.id)
            const expectedResults = updateArrayWithOverrides(eventEnrollsWithoutDeleted, [
              { isSpare: false },
              { isSpare: false },
              { isSpare: false }
            ])

            const getResponse = await api.get(`/api/events/${complexEventId}/enrolls`)
              .expect(200)
              .expect('Content-Type', /application\/json/)

            expect(getResponse.body).toEqual(expect.arrayContaining(expectedResults))
          })
          test('DELETE /api/intra/events/:complexEventId/enrolls does not updates last optionA when optionB enroll is deleted', async() => {
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
            const deletedEventEnroll = eventEnrollsAtStart[2]
            await api.delete(`/api/intra/events/${complexEventId}/enrolls/${deletedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .expect(204)

            const eventEnrollsWithoutDeleted = eventEnrollsAtStart.filter(({ id }) => id !== deletedEventEnroll.id)
            const expectedResults = updateArrayWithOverrides(eventEnrollsWithoutDeleted, [
              { isSpare: false },
              { isSpare: false },
              { isSpare: true }
            ])

            const getResponse = await api.get(`/api/events/${complexEventId}/enrolls`)
              .expect(200)
              .expect('Content-Type', /application\/json/)

            expect(getResponse.body).toEqual(expect.arrayContaining(expectedResults))
          })
          test('DELETE /api/intra/events/:complexEventId/enrolls does not updates last optionA when optionC unlimited enroll is deleted', async() => {
            const dummyEnrolls = [
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('5', 'minutes').format(),
                  updatedAt: null,
                  // isSpare: false,
                  values: {
                    etunimi: 'Name1',
                    radio: 'option-a'
                  }
                }
              },
              {
                eventId: complexEventId,
                eventEnrollData: {
                  createdAt: moment(currentDate).add('15', 'minutes').format(),
                  updatedAt: null,
                  // isSpare: false,
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
                  // isSpare: true,
                  values: {
                    etunimi: 'Name3',
                    radio: 'option-a'
                  }
                }
              }
            ]
            await insertEnrolls(db, dummyEnrolls)

            const eventEnrollsAtStart = await eventEnrollsInDbByEvent(db, complexEventId)
            const deletedEventEnroll = eventEnrollsAtStart[2]
            await api.delete(`/api/intra/events/${complexEventId}/enrolls/${deletedEventEnroll.id}`)
              .set('Authorization', jwtToken)
              .expect(204)

            const eventEnrollsWithoutDeleted = eventEnrollsAtStart.filter(({ id }) => id !== deletedEventEnroll.id)
            const expectedResults = updateArrayWithOverrides(eventEnrollsWithoutDeleted, [
              { isSpare: false },
              { isSpare: false },
              { isSpare: true }
            ])

            const getResponse = await api.get(`/api/events/${complexEventId}/enrolls`)
              .expect(200)
              .expect('Content-Type', /application\/json/)

            expect(getResponse.body).toEqual(expect.arrayContaining(expectedResults))
          })
        })
      })
    })
  })
})
