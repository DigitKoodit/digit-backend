const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')({ mergeParams: true })

const { validateCreate, validateUpdate } = require('../../models/sponsor/sponsorValidators')
const { decorate, decorateList } = require('../../models/sponsor/sponsorDecorators')
const { findById, findAll, save, remove } = require('../../models/sponsor/sponsorModel')

router.get('/', (req, res) =>
  findAll()
    .then(decorateList)
    .then(result => res.send(result)))

const findPageById = (req, _, next, value) =>
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

router.put('/:sponsorId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)
  return save({ ...oldItem, ...toSave }, req.params.sponsorId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:sponsorId', (req, res) => {
  const { sponsorId } = req.params
  return remove(sponsorId)
    .then(id => res.status(204).send())
})

router.param('sponsorId', findPageById)

publicRouter.get('/', (req, res) =>
  findAll(true)
    .then(decorateList)
    .then(result => res.send(result)))

publicRouter.get('/:sponsorId', (req, res) =>
  Promise.resolve(decorate(req.resultRow))
    .then(result => res.send(result))
)

publicRouter.param('sponsorId', findPageById)

module.exports = {
  router,
  publicRouter
}
