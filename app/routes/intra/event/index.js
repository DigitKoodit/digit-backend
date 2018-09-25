const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')({ mergeParams: true })
const { validateCreate, validateUpdate } = require('../../../models/event/eventValidators')
const { decorate, decorateList } = require('../../../models/event/eventDecorators')
const { findById, findAll, save, remove } = require('../../../models/event/eventModel')

router.get('/', (req, res) =>
  findAll()
    .then(decorateList)
    .then(result => res.send(result)))

const findEventById = (req, _, next, value) =>
  findById(value)
    .then(resultRow => {
      req.resultRow = resultRow
      next()
    })

router.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(newItem)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.put('/:eventId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)
  return save({ ...oldItem, ...toSave }, req.params.eventId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:eventId', (req, res) => {
  const { eventId } = req.params
  return remove(eventId)
    .then(id => res.status(204).send())
})

router.param('eventId', findEventById)

publicRouter.get('/', (req, res) =>
  findAll(true)
    .then(decorateList)
    .then(result => res.send(result)))

publicRouter.get('/:eventId', (req, res) =>
  Promise.resolve(decorate(req.resultRow))
    .then(result => res.send(result))
)

publicRouter.param('eventId', findEventById)

module.exports = {
  router,
  publicRouter
}
