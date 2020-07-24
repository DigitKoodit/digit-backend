const moment = require('moment')
const lolex = require('lolex')
const { BadRequest, Forbidden } = require('http-errors')
const { isEnrollPossible, getLimitedFieldIfEnrollMatch, getLimitedFields } = require('./enrollHelpers')

describe('Enroll helpers', () => {
  let fakeClock
  const initialStartTime = '2019-01-01T10:00:00+02:00'
  const eventActiveAt = '2019-01-01T12:00:00+02:00'
  const eventActiveUntil = '2019-02-01T12:00:00+02:00'
  const eventReservedUntil = '2019-01-31T12:00:00+02:00'
  const mostEnrolledAt = '2019-01-01T13:00:00+02:00'
  const setDate = dateString => {
    fakeClock = lolex.install({
      now: new Date(dateString),
      toFake: ['Date']
    })
  }
  const simpleEvent = {
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
      },
      {
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

  const dummyEnroll = {
    values: {
      firstName: 'New name',
      radio: 'optionA'
    }
  }

  beforeEach(async() => {
    setDate(initialStartTime)
  })

  afterAll(() => {
    fakeClock.uninstall()
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
    describe('enrolling after event has ended', () => {
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
        const enrolls = Array(maxEnrolls).fill(dummyEnroll)
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
      expect(getLimitedFieldIfEnrollMatch(simpleEvent.fields, enrollWithLimitedOption)).toEqual(['radio', 'optionA'])
    })
  })
  describe('getLimitedField', () => {
    it('should return event fields with options which has reservedCount', () => {
      const expectedResult = [
        ['radio_optionA', 4],
        ['radio_optionB', 2],
        ['radio2_optionC', 5],
        ['radio2_optionD', null]
      ]
      expect(getLimitedFields(simpleEvent.fields)).toEqual(expectedResult)
    })
    it('should return object with null values when fields does not have reserve count', () => {
      const expectedResult = [
        ['radio_optionA', null],
        ['radio_optionB', null]
      ]
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
