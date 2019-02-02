const { decorateList } = require('../app/models/event/eventDecorators')

const initialEvents = [
  {
    event_id: 1,
    event_data: {
      name: 'Event name',
      activeAt: '2019-01-01T12:00:00+02:00',
      activeUntil: '2019-02-01T12:00:00+02:00',
      isVisible: true,
      maxParticipants: null,
      reserveCount: 0,
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
          maxLength: 64,
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
      isVisible: true,
      maxParticipants: null,
      reserveCount: 0,
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
      `INSERT INTO event (event_data) VALUES ($[event_data])`, event))
    ))

const removeAllFromDb = db => db.none('TRUNCATE TABLE event RESTART IDENTITY CASCADE')

module.exports = {
  initialEvents,
  eventsInDb,
  insertInitialEvents,
  removeAllFromDb
}