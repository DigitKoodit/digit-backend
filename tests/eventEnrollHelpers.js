const { pgp } = require('../db/pgp')
const { decorateList, decoratePublicList } = require('../app/models/event/eventEnrollDecorators')

// *NOTE* enrolls relies on existing evetns 1 and 2. Defined in ./eventHelpers.js
const initialEventEnrolls = [
  {
    id: 1,
    eventId: 1,
    eventEnrollData: {
      createdAt: '2019-01-02T12:00:00+02:00',
      updatedAt: null,
      isSpare: false,
      values: {
        etunimi: 'Test',
        sukunimi: 'Person'
      }
    }
  },
  {
    id: 2,
    eventId: 1,
    eventEnrollData: {
      createdAt: '2019-01-02T13:00:00+02:00',
      updatedAt: null,
      isSpare: false,
      values: {
        etunimi: 'Bob',
        sukunimi: 'Uncle'
      }
    }
  },
  {
    id: 3,
    eventId: 2,
    eventEnrollData: {
      createdAt: '2019-01-15T13:00:00+02:00',
      updatedAt: null,
      isSpare: false,
      values: {
        etunimi: 'Other',
        radio: 'option-a'
      }
    }
  }
]

const eventEnrollsInDb = (db, getPublic) =>
  db.any('SELECT * FROM event_enroll ORDER BY event_enroll_id')
    .then(getPublic ? decoratePublicList : decorateList)

const eventEnrollsInDbByEvent = (db, eventId, getPublic) =>
  db.any(`SELECT ee.*, e.event_data->'fields' fields
    FROM event_enroll ee
    LEFT JOIN event e ON e.event_id = ee.event_id
    WHERE e.event_id = $[eventId]  ORDER BY event_enroll_id`, { eventId })
    .then(getPublic ? decoratePublicList : decorateList)

const insertInitialEventEnrolls = db =>
  insertEnrolls(db, initialEventEnrolls)

const insertEnrolls = (db, enrolls) => {
  const columnSet = new pgp.helpers.ColumnSet([
    { name: 'event_id', prop: 'eventId' },
    { name: 'event_enroll_data', prop: 'eventEnrollData', mod: ':json' }

  ], { table: 'event_enroll' })
  const insertEnrolls = pgp.helpers.insert(enrolls, columnSet)
  return db.any(insertEnrolls)
}

const removeAllFromDb = db => db.none('TRUNCATE TABLE event_enroll RESTART IDENTITY CASCADE')

module.exports = {
  initialEventEnrolls,
  eventEnrollsInDb,
  eventEnrollsInDbByEvent,
  insertInitialEventEnrolls,
  insertEnrolls,
  removeAllFromDb
}
