const { decorateList } = require('../app/models/event/eventDecorators')

const initialEvents = [
  {
    event_id: 1,
    event_data: {
      name: 'Event name',
      activeAt: '2019-01-01T12:00:00+02:00',
      activeUntil: '2019-02-01T12:00:00+02:00',
      reservedUntil: '2019-01-31T12:00:00+02:00',
      isVisible: true,
      maxParticipants: 10,
      reserveCount: null,
      description: `Event description`,
      fields: [
        {
          id: 0,
          name: 'etunimi',
          label: 'Etunimi',
          type: 'text',
          placeholder: null,
          maxLength: 64,
          isTextarea: false,
          fieldName: 'Teksti',
          required: true,
          public: true,
          order: 0
        },
        {
          id: 1,
          name: 'sukunimi',
          label: 'Sukunimi',
          type: 'text',
          placeholder: null,
          maxLength: 10,
          isTextarea: false,
          fieldName: 'Teksti',
          required: true,
          public: true,
          order: 1
        }
      ]
    }
  },
  {
    event_id: 2,
    event_data: {
      name: 'Second event name',
      activeAt: '2019-01-01T12:00:00+02:00',
      activeUntil: '2019-02-01T12:00:00+02:00',
      reservedUntil: '2019-01-31T12:00:00+02:00',
      isVisible: true,
      maxParticipants: 3,
      reserveCount: 1,
      description: `Second event description`,
      fields: [
        {
          id: 0,
          name: 'etunimi',
          label: 'Etunimi',
          type: 'text',
          placeholder: null,
          maxLength: 64,
          isTextarea: false,
          fieldName: 'Teksti',
          required: true,
          public: true,
          order: 0
        },
        {
          id: 1,
          name: 'radio',
          type: 'radio',
          label: 'Radio',
          fieldName: 'Valinta',
          required: true,
          public: true,
          order: 0,
          options: [
            {
              name: 'option-a',
              label: 'Option A',
              isDefault: false,
              reserveCount: 2
            },
            {
              name: 'option-b',
              label: 'Option B',
              order: 0,
              value: false,
              reserveCount: 1
            }
          ]
        }
      ]
    }
  }
]

const eventsInDb = db =>
  db.any('SELECT * FROM event ORDER BY event_id')
    .then(decorateList)

const insertInitialEvents = db =>
  db.tx(t =>
    t.batch(initialEvents.map(event => db.none(
      `INSERT INTO event (event_id, event_data) VALUES ($[event_id], $[event_data])`, event))
    )
    // For some reason batch doesn't keep the order.. and therefore 
    .then(() => t.none('ALTER SEQUENCE event_event_id_seq RESTART WITH 3')))

const removeAllFromDb = db => db.none('TRUNCATE TABLE event RESTART IDENTITY CASCADE')

module.exports = {
  initialEvents,
  eventsInDb,
  insertInitialEvents,
  removeAllFromDb
}