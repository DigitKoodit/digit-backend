const router = require('express-promise-router')({ mergeParams: true })

const { validateCreate, validateUpdate } = require('../../models/siteContent/sitePageValidators')
const { decorate, decorateList } = require('../../models/siteContent/sitePageDecorators')
const { findById, findAll, save, remove } = require('../../models/siteContent/sitePageModel')

router.use('/navigation', require('./navItem'))

router.get('/', (req, res) =>
  findAll()
    .then(decorateList)
    .then(result => res.send(result)))

router.param('sitePageId', (req, _, next, value) => {
  return findById(value)
    .then(resultSitePage => {
      req.resultSitePage = resultSitePage
      next()
    })
})

router.get('/:sitePageId', (req, res) =>
  Promise.resolve(decorate(req.resultSitePage))
    .then(result => res.send(result))
)

router.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(newItem)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.put('/:sitePageId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultSitePage)
  return save({ ...oldItem, ...toSave }, req.params.sitePageId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:sitePageId', (req, res) => {
  const { sitePageId } = req.params
  return remove(sitePageId)
    .then(id => res.status(204).send())
})

module.exports = router
