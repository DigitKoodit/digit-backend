const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')()

const { validateCreate, validateUpdate } = require('../../models/siteContent/navItemValidators')
const { decorate, decorateList } = require('../../models/siteContent/navItemDecorators')
const { findById, findAll, save, remove } = require('../../models/siteContent/navItemModel')

router.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(newItem)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.put('/:navItemId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultNavItem)
  return save({ ...oldItem, ...toSave }, req.params.navItemId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:navItemId', (req, res) => {
  const { navItemId } = req.params
  return remove(navItemId)
    .then(id => res.status(204).send())
})

router.get('/', (req, res) =>
  findAll()
    .then(decorateList)
    .then(result => res.send(result)))

// TODO: *doc* publicRouter can be included to different routes which doesn't require authentication
publicRouter.get('/', (req, res) =>
  findAll(true)
    .then(decorateList)
    .then(result => res.send(result)))

const findNavItemById = (req, _, next, value) =>
  findById(value)
    .then(resultNavItem => {
      req.resultNavItem = resultNavItem
      next()
    })

publicRouter.param('navItemId', findNavItemById)

router.param('navItemId', findNavItemById)

module.exports = {
  router,
  publicRouter
}
