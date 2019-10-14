const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')({ mergeParams: true })

const { findByIdToResultRow } = require('../../helpers/helpers')
const { validateCreate, validateUpdate } = require('../../models/siteContent/sitePageValidators')
const { decorate, decorateList } = require('../../models/siteContent/sitePageDecorators')
const { findById, findAll, save, remove } = require('../../models/siteContent/sitePageModel')

router.get('/', (req, res) =>
  findAll(req.db)
    .then(decorateList)
    .then(result => res.send(result)))

router.get('/:sitePageId', (req, res) =>
  res.send(decorate(req.resultRow)))

router.post('/', validateCreate(), (req, res) => {
  const newItem = {
    ...req.body
  }
  return save(req.db, newItem)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.put('/:sitePageId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)
  return save(req.db, { ...oldItem, ...toSave }, req.params.sitePageId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:sitePageId', (req, res) => {
  const { sitePageId } = req.params
  return remove(req.db, sitePageId)
    .then(() => res.status(204).send())
})

const findPageById = findByIdToResultRow('Page', 'sitePageId', findById)

router.param('sitePageId', findPageById)

publicRouter.param('sitePageId', findPageById)

publicRouter.get('/:sitePageId', (req, res) =>
  res.send(decorate(req.resultRow)))

module.exports = {
  router,
  publicRouter
}
