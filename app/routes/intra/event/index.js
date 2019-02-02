const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')({ mergeParams: true })

const { validateCreate, validateUpdate } = require('../../../models/event/eventValidators')
const { decorate, decorateList } = require('../../../models/event/eventDecorators')
const { findById, findAll, save, remove } = require('../../../models/event/eventModel')
const { findByIdToResultRow } = require('../../../helpers/helpers')

router.get('/', (req, res) =>
  findAll(req.db)
    .then(decorateList)
    .then(result => res.send(result)))


router.get('/:eventId', (req, res) =>
  res.send(decorate(req.resultRow)))


router.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(req.db, newItem)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.put('/:eventId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)
  return save(req.db, { ...oldItem, ...toSave }, req.params.eventId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:eventId', (req, res) => {
  const { eventId } = req.params
  return remove(req.db, eventId)
    .then(id => res.status(204).send())
})

const findEventById = findByIdToResultRow('Event', 'eventId', findById)

router.param('eventId', findEventById)

publicRouter.get('/', (req, res) =>
  findAll(req.db, true)
    .then(decorateList)
    .then(result => res.send(result)))

publicRouter.get('/:eventId', (req, res) =>
  res.send(decorate(req.resultRow)))

publicRouter.param('eventId', findEventById)

router.use('/:eventId/enrolls', require('./enroll').router)
publicRouter.use('/:eventId/enrolls', require('./enroll').publicRouter)


module.exports = {
  router,
  publicRouter
}
