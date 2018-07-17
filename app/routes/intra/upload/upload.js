const router = require('express-promise-router')({ mergeParams: true })

const { validateCreate, validateUpdate } = require('../../models/upload/uploadValidators')
const { decorate, decorateList } = require('../../models/upload/uploadDecorators')
const { findById, findAll, save, remove } = require('../../models/upload/uploadModel')

router.get('/', (req, res) =>
  findAll()
    .then(decorateList)
    .then(result => res.send(result)))

const findContentById = (req, _, next, value) =>
  findById(value)
    .then(resultSitePage => {
      req.resultSitePage = resultSitePage
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

router.put('/:uploadId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultSitePage)
  return save({ ...oldItem, ...toSave }, req.params.uploadId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:uploadId', (req, res) => {
  const { uploadId } = req.params
  return remove(uploadId)
    .then(id => res.status(204).send())
})

router.param('uploadId', findContentById)

module.exports = router
