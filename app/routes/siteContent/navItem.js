const router = require('express-promise-router')({ mergeParams: true })

const { validateCreate, validateUpdate } = require('../../models/siteContent/navItemValidators')
const { decorate, decorateList, constructNavigation } = require('../../models/siteContent/navItemDecorators')
const { findById, findAll, save, remove } = require('../../models/siteContent/navItemModel')

router.get('/', (req, res) =>
  findAll()
    .then(decorateList)
    .then(constructNavigation)
    .then(result => res.send(result)))

router.param('navItemId', (req, _, next, value) => {
  return findById(value)
    .then(resultNavItem => {
      req.resultNavItem = resultNavItem
      next()
    })
})

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

module.exports = router
