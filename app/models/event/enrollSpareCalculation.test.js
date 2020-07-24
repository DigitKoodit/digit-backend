const { calculateSpareParticipants } = require('./enrollHelpers')
const { updateArrayWithOverrides } = require('../../helpers/helpers')
const { setClockDate, uninstallClock } = require('../../../tests/testHelpers')

const currentTime = '2019-01-01T10:00:00+02:00'
const mostEnrolledAt = '2019-01-01T13:00:00+02:00'

const simpleEvent = {
  activeAt: '2019-01-01T12:00:00+02:00',
  activeUntil: '2019-02-01T12:00:00+02:00',
  reservedUntil: '2019-01-31T12:00:00+02:00',
  maxParticipants: 5,
  reserveCount: 2,
  fields: []
}

const defaultFields = [
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
      },
      {
        name: 'optionC',
        label: 'OptionC',
        reserveCount: 2
      },
      {
        name: 'optionD',
        label: 'OptionD',
        reserveCount: 0
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
        reserveCount: 2
      },
      {
        name: 'optionD',
        label: 'OptionD',
        reserveCount: null
      }
    ]
  }
]

const noneOptionFields = [
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
  }
]

const onlyNonLimitedOptionFields = [
  {
    id: 0,
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
        reserveCount: null
      }
    ]
  }
]

const buildEvent = (eventProperties, fields) => ({
  ...simpleEvent,
  ...(eventProperties || {}),
  fields: fields || [...defaultFields]
})

const eventEnrollTestCases = [
  [
    'enrolls with event limits should not have spares', // Step description
    [
      { id: 1, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
      { id: 2, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
      { id: 3, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
      { id: 4, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } },
      { id: 5, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionB' } }
    ],
    [ // Fields for expected results
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false }
    ],
    null, // Override event properties {},
    null // Override event fields
  ],
  [
    'enrolls over default "maxParticipants" limit should have spares',
    [
      { id: 1, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionA' } },
      { id: 2, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionA' } },
      { id: 3, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionA' } },
      { id: 4, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } },
      { id: 5, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionB' } },
      { id: 6, createdAt: mostEnrolledAt, values: { firstName: 'Name6', radio: 'optionB' } },
      { id: 7, createdAt: mostEnrolledAt, values: { firstName: 'Name7', radio: 'optionB' } }
    ],
    [
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: true },
      { isSpare: true }
    ],
    null,
    null
  ],
  [
    'enrolls when event does not have "reserveCount" should be spares even though event should not have reserve',
    // NOTE: spare calculator doesn't care if too many enrolls have been passed to it.
    // It is a responsibility of enroll validator and helpers to prevent when new enroll is about to be created
    [
      { id: 1, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio2: 'optionD' } },
      { id: 2, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio2: 'optionD' } },
      { id: 3, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio2: 'optionD' } },
      { id: 4, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio2: 'optionD' } },
      { id: 5, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio2: 'optionD' } },
      { id: 6, createdAt: mostEnrolledAt, values: { firstName: 'Name6', radio2: 'optionD' } },
      { id: 7, createdAt: mostEnrolledAt, values: { firstName: 'Name7', radio2: 'optionD' } }
    ],
    [
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: true },
      { isSpare: true }
    ],
    { reserveCount: 0 },
    null
  ],
  [
    'enrolls over field limit should have spares',
    [
      { id: 1, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionB' } },
      { id: 2, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionB' } },
      { id: 3, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionB' } },
      { id: 4, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionB' } },
      { id: 5, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionB' } },
      { id: 6, createdAt: mostEnrolledAt, values: { firstName: 'Name6', radio: 'optionB' } },
      { id: 7, createdAt: mostEnrolledAt, values: { firstName: 'Name7', radio: 'optionB' } }
    ],
    [
      { isSpare: false },
      { isSpare: false },
      { isSpare: true },
      { isSpare: true },
      { isSpare: true },
      { isSpare: true },
      { isSpare: true }
    ],
    null,
    null
  ],
  [
    'mixed enrolls over field limit should have spares',
    [
      { id: 1, createdAt: mostEnrolledAt, values: { firstName: 'Name1', radio: 'optionC' } },
      { id: 2, createdAt: mostEnrolledAt, values: { firstName: 'Name2', radio: 'optionC' } },
      { id: 3, createdAt: mostEnrolledAt, values: { firstName: 'Name3', radio: 'optionB' } },
      { id: 4, createdAt: mostEnrolledAt, values: { firstName: 'Name4', radio: 'optionA' } },
      { id: 5, createdAt: mostEnrolledAt, values: { firstName: 'Name5', radio: 'optionC' } },
      { id: 6, createdAt: mostEnrolledAt, values: { firstName: 'Name6', radio: 'optionC' } },
      { id: 7, createdAt: mostEnrolledAt, values: { firstName: 'Name7', radio: 'optionA' } }
    ],
    [
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: true },
      { isSpare: true },
      { isSpare: false }
    ],
    { maxParticipants: 10 },
    null
  ],
  [
    'enrolls when no option fields available',
    [
      { id: 1, createdAt: mostEnrolledAt, values: { firstName: 'Name1' } },
      { id: 2, createdAt: mostEnrolledAt, values: { firstName: 'Name2' } },
      { id: 3, createdAt: mostEnrolledAt, values: { firstName: 'Name3' } },
      { id: 4, createdAt: mostEnrolledAt, values: { firstName: 'Name4' } },
      { id: 5, createdAt: mostEnrolledAt, values: { firstName: 'Name5' } }
    ],
    [
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false }
    ],
    null,
    noneOptionFields
  ],
  [
    'enrolls when only non limited option fields available',
    [
      { id: 1, createdAt: mostEnrolledAt, values: { radio: 'optionA' } },
      { id: 2, createdAt: mostEnrolledAt, values: { radio: 'optionA' } },
      { id: 3, createdAt: mostEnrolledAt, values: { radio: 'optionB' } },
      { id: 4, createdAt: mostEnrolledAt, values: { radio: 'optionB' } },
      { id: 5, createdAt: mostEnrolledAt, values: { radio: 'optionB' } }
    ],
    [
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false },
      { isSpare: false }
    ],
    null,
    onlyNonLimitedOptionFields
  ]
]

beforeEach(async() => {
  setClockDate(currentTime)
})

afterAll(() => { uninstallClock() })

test.each(eventEnrollTestCases)('%s', (__testCaseName, enrolls, expectedOverrides, eventProperties, fields) => {
  const expectedResult = updateArrayWithOverrides(enrolls, expectedOverrides)
  const event = buildEvent(eventProperties, fields)
  expect(calculateSpareParticipants(event, enrolls)).toEqual(expectedResult)
})
