const moment = require('moment')
const lolex = require('lolex')
const { BadRequest, Forbidden } = require('http-errors')
const { isEnrollPossible, determineIsSpare, getLimitedFieldIfEnrollMatch } = require('./enrollHelpers')


describe('Enroll helpers', () => {
  let fakeClock
  let initialStartTime = '2019-01-01T10:00:00+02:00'
  let eventActiveAt = '2019-01-01T12:00:00+02:00'
  let eventActiveUntil = '2019-02-01T12:00:00+02:00'
  let eventReservedUntil = '2019-01-31T12:00:00+02:00'
  let mostEnrolledAt = '2019-01-01T13:00:00+02:00'
  const setDate = dateString => {
    fakeClock = lolex.install({
      now: new Date(dateString),
      toFake: ['Date']
    })
  }
  let simpleEvent = {
    activeAt: eventActiveAt,
    activeUntil: eventActiveUntil,
    reservedUntil: eventReservedUntil,
    maxParticipants: 5,
    reserveCount: 2,
    fields: [
      {
        id: 0,
        name: 'firstName',
        type: 'text',
        label: 'FirstName',
        public: true,
        required: true,
        fieldName: 'Teksti',
        maxLength: 10,
        isTextarea: false,
        placeholder: null
      },
      {
        id: 1,
        name: 'radio',
        type: 'radio',
        label: 'Valinta',
        public: true,
        fieldName: 'Valinta',
        required: true,
        options: [
          {
            name: 'optionA',
            label: 'OptionA',
            reserveCount: 5
          },
          {
            name: 'optionB',
            label: 'OptionB',
            value: false,
            reserveCount: 2
          }
        ]
      }
    ]
  }

  let dummyEnroll = {
    values: {
      firstName: 'New name',
      radio: 'optionA'
    }
  }

  beforeAll(async () => {
    setDate(initialStartTime)
  })

  afterAll(() => {
    fakeClock.uninstall()
  })

  describe('determineIsSpare', () => {
    describe('Event has space', () => {
      it('should return false when regular space left', () => {
        let oneRegularSpaceLeftEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } }
        ]
        const isSpare = determineIsSpare(simpleEvent, oneRegularSpaceLeftEnrolls, dummyEnroll)
        expect(isSpare).toBeFalsy()
      })
      it('should return true when no option "optionB" limit is reached', () => {
        let optionBLimitReachedEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionB' } },
          { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } },
          { id: 5, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionB' } }
        ]
        const optionBEnroll = {
          values: {
            firstName: 'Something',
            radio: 'optionB'
          }
        }
        const isSpare = determineIsSpare(simpleEvent, optionBLimitReachedEnrolls, optionBEnroll)
        expect(isSpare).toBeTruthy()
      })
    })
    describe(`Event does not have space`, () => {
      it('should return true when no regular space left', () => {
        let noRegularSpaceLeftEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } },
          { id: 5, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionB' } }
        ]
        const isSpare = determineIsSpare(simpleEvent, noRegularSpaceLeftEnrolls, dummyEnroll)
        expect(isSpare).toBeTruthy()
      })
      it('should throw error when event is completely full', () => {
        let noRegularOrLimitSpaceLeftEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 5, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 6, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } },
          { id: 7, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionB' } }
        ]
        expect(() =>
          determineIsSpare(simpleEvent, noRegularOrLimitSpaceLeftEnrolls, dummyEnroll)
        ).toThrowError('Event is full')
      })
    })
  })
  describe('isEnrollPossible', () => {
    describe('enrolling before event has started', () => {
      it('should throw Forbidden error', () => {
        const dummyPreviousEnrolls = [dummyEnroll]
        const timeBeforeEventStartTime = moment(eventActiveAt).subtract(1, 'minute').format()
        setDate(timeBeforeEventStartTime)
        expect(() =>
          isEnrollPossible(simpleEvent, dummyPreviousEnrolls)
        ).toThrow(Forbidden)
      })
    })
    describe('enrolling after event has started', () => {
      it('should throw Forbidden error', () => {
        const dummyPreviousEnrolls = [dummyEnroll]
        const timeAfterEventEndTime = moment(eventActiveUntil).add(1, 'minute').format()
        setDate(timeAfterEventEndTime)
        expect(() =>
          isEnrollPossible(simpleEvent, dummyPreviousEnrolls)
        ).toThrow(Forbidden)
      })
    })
    describe('enrolling to a full event after it has started', () => {
      it('should throw BadRequest error', () => {
        const maxEnrolls = 8
        const enrolls = Array.apply(null, { length: maxEnrolls }).map(entry => dummyEnroll)
        const timeAfterEventStartTime = moment(eventActiveAt).add(1, 'minute').format()
        setDate(timeAfterEventStartTime)
        expect(() =>
          isEnrollPossible(simpleEvent, enrolls)
        ).toThrow(BadRequest)
      })
    })
    describe('enrolling after event has started with no previous enrolls', () => {
      it('should return true', () => {
        const enrolls = []
        const timeAfterEventStartTime = moment(eventActiveAt).add(1, 'minute').format()
        setDate(timeAfterEventStartTime)
        expect(isEnrollPossible(simpleEvent, enrolls)).toBeTruthy()
      })
    })
  })
  describe('getLimitedFieldIfEnrollMatch', () => {
    it('should return name and value of limited field', () => {
      const enrollWithLimitedOption = { id: 1, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } }
      expect(getLimitedFieldIfEnrollMatch(simpleEvent, enrollWithLimitedOption)).toEqual(['radio', 'optionA'])
    })

  })
})