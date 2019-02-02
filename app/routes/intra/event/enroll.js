const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')({ mergeParams: true })
const { validateCreate, validateUpdate } = require('../../../models/event/eventEnrollValidators')
const { decorate, decorateList, decoratePublic, decoratePublicList } = require('../../../models/event/eventEnrollDecorators')
const { findById, findAll, save, remove } = require('../../../models/event/eventEnrollModel')
const { findByIdToResultRow } = require('../../../helpers/helpers')

router.get('/', (req, res) =>
  findAll(req.db, req.params.eventId)
    .then(decorateList)
    .then(result => res.send(result)))

router.put('/:eventEnrollId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)
  return save(req.db, req.params.eventId, { ...oldItem, ...toSave }, req.params.eventEnrollId)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.delete('/:eventEnrollId', (req, res) => {
  const { eventEnrollId } = req.params
  return remove(req.db, eventEnrollId)
    .then(id => res.status(204).send())
})

router.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(req.db, req.params.eventId, newItem)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

const findEventEnrollById = findByIdToResultRow('Event enroll', 'eventEnrollId', findById)

router.param('eventEnrollId', findEventEnrollById)

publicRouter.get('/', (req, res) =>
  findAll(req.db, req.params.eventId, true)
    .then(decoratePublicList)
    .then(result => res.send(result)))

publicRouter.get('/:eventEnrollId', (req, res) =>
  res.send(decoratePublic(req.resultRow)))

publicRouter.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(req.db, req.params.eventId, newItem)
    .then(decoratePublic)
    .then(result => res.status(201).send(result))
})


publicRouter.param('eventEnrollId', findEventEnrollById)

module.exports = {
  router,
  publicRouter
}
