const moment = require('moment')
const lolex = require('lolex')
const { BadRequest, Forbidden } = require('http-errors')
const { isEnrollPossible, determineIsSpare, getLimitedFieldIfEnrollMatch, getLimitedFields } = require('./enrollHelpers')


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
            reserveCount: 4
          },
          {
            name: 'optionB',
            label: 'OptionB',
            value: false,
            reserveCount: 2
          }
        ]
      }, {
        id: 2,
        name: 'radio2',
        type: 'radio',
        label: 'Valinta2',
        public: true,
        fieldName: 'Valinta2',
        required: true,
        options: [
          {
            name: 'optionC',
            label: 'OptionC',
            reserveCount: 5
          },
          {
            name: 'optionD',
            label: 'OptionD',
            value: false,
            reserveCount: null
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

  beforeEach(async () => {
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
        expect(isSpare).toBe(false)
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
        expect(isSpare).toBe(true)
      })
      it('should throw error when event has no spare and field reserve count is full', () => {
        let optionBLimitReachedEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionB' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionB' } }
        ]
        const noSpareEvent = {
          ...simpleEvent,
          reserveCount: 0
        }
        const optionBEnroll = {
          values: {
            firstName: 'Something',
            radio: 'optionB'
          }
        }
        expect(() =>
          determineIsSpare(noSpareEvent, optionBLimitReachedEnrolls, optionBEnroll))
          .toThrowError('Field limit reached')
      })
      it('should return false when "optionA" is added even "optionB" limit is reached', () => {
        let optionBLimitReachedEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionB' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionB' } }
        ]
        const noSpareEvent = {
          ...simpleEvent,
          reserveCount: 0
        }
        const optionBEnroll = {
          values: {
            firstName: 'Something',
            radio: 'optionA'
          }
        }
        const isSpare = determineIsSpare(noSpareEvent, optionBLimitReachedEnrolls, optionBEnroll)
        expect(isSpare).toBe(false)
      })
      it('should return false when event limits are open', () => {
        let oneRegularSpaceLeftEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionB' } },
          { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } }
        ]
        const timeAfterLimitsOpened = moment(eventReservedUntil).add(1, 'minute').format()
        setDate(timeAfterLimitsOpened)
        const optionBEnroll = {
          values: {
            firstName: 'Something',
            radio: 'optionB'
          }
        }
        const isSpare = determineIsSpare(simpleEvent, oneRegularSpaceLeftEnrolls, optionBEnroll)
        expect(isSpare).toBe(false)
      })
    })
    describe(`Event does not have space`, () => {
      it('should return true when no regular space left', () => {
        let noRegularSpaceLeftEnrolls = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 5, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 6, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } }
        ]
        const isSpare = determineIsSpare(simpleEvent, noRegularSpaceLeftEnrolls, dummyEnroll)
        expect(isSpare).toBe(true)
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
          determineIsSpare(simpleEvent, noRegularOrLimitSpaceLeftEnrolls, dummyEnroll))
          .toThrowError('Event is full')
      })
      it('field limit optionC is full', () => {
        let optionCLimitIsFull = [
          { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionC' } },
          { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionC' } },
          { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionB' } },
          { id: 5, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
          { id: 6, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionC' } },
          { id: 7, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionC' } },
          { id: 7, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionC' } }
        ]
        let fieldLimitFullEvent = {
          activeAt: eventActiveAt,
          activeUntil: eventActiveUntil,
          reservedUntil: eventReservedUntil,
          maxParticipants: 5,
          reserveCount: 3,
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
                  reserveCount: 30
                },
                {
                  name: 'optionB',
                  label: 'OptionB',
                  value: false,
                  reserveCount: 3
                },
                {
                  name: 'optionC',
                  label: 'OptionC',
                  value: false,
                  reserveCount: 2
                }
              ]
            }
          ]
        }
        let dummyCEnroll = {
          values: {
            firstName: 'Fuller',
            radio: 'optionC'
          }
        }
        expect(() =>
          determineIsSpare(fieldLimitFullEvent, optionCLimitIsFull, dummyCEnroll))
          .toThrowError('Field limit reached')
      })
    })
    describe('Event has no field limits', () => {
      const reserveFreeEvent = {
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
                reserveCount: null
              },
              {
                name: 'optionB',
                label: 'OptionB',
                value: false,
                reserveCount: null
              }
            ]
          }
        ]
      }
      describe('reserve is full', () => {
        it('should return true when max participants is full', () => {
          let noRegularOrLimitSpaceLeftEnrolls = [
            { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionB' } },
            { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionB' } },
            { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } },
            { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } },
            { id: 5, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } },
            { id: 6, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } }
          ]
          expect(determineIsSpare(reserveFreeEvent, noRegularOrLimitSpaceLeftEnrolls, dummyEnroll))
            .toBe(true)
        })
        it('should return false when max participants not full', () => {
          let noRegularOrLimitSpaceLeftEnrolls = [
            { id: 1, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionB' } },
            { id: 2, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionB' } },
            { id: 3, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } },
            { id: 4, isSpare: false, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } },
          ]
          expect(determineIsSpare(reserveFreeEvent, noRegularOrLimitSpaceLeftEnrolls, dummyEnroll))
            .toBe(false)
        })
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
        expect(isEnrollPossible(simpleEvent, enrolls)).toBe(true)
      })
    })
    describe('enrolling after event has started with no previous enrolls', () => {
      it('should throw BadRequest error', () => {
        const enrolls = []
        const timeAfterEventStartTime = moment(eventActiveAt).add(1, 'minute').format()
        setDate(timeAfterEventStartTime)
        expect(isEnrollPossible(simpleEvent, enrolls)).toBe(true)
      })
    })
  })
  describe('getLimitedFieldIfEnrollMatch', () => {
    it('should return name and value of limited field', () => {
      const enrollWithLimitedOption = { id: 1, isSpare: true, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } }
      expect(getLimitedFieldIfEnrollMatch(simpleEvent, enrollWithLimitedOption)).toEqual(['radio', 'optionA'])
    })
  })
  describe('getLimitedField', () => {
    it('should return event fields with options which has reservedCount', () => {
      const expectedResult = {
        radio: {
          optionA: 4,
          optionB: 2
        },
        radio2: {
          optionC: 5
        }
      }
      console.log(getLimitedFields(simpleEvent.fields))
      expect(getLimitedFields(simpleEvent.fields)).toEqual(expectedResult)
    })
    it('should return object with null values when fields does not have reserve count', () => {
      const expectedResult = { radio: {} }
      const event = {
        ...simpleEvent,
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
                reserveCount: null
              },
              {
                name: 'optionB',
                label: 'OptionB',
                value: false,
                reserveCount: null
              }
            ]
          }
        ]
      }
      expect(getLimitedFields(event.fields)).toEqual(expectedResult)
    })
  })
})