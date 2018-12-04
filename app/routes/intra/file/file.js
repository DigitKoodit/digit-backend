const router = require('express-promise-router')()

const { validateCreate, validateUpdate } = require('../../../models/file/fileValidators')
const { decorate, decorateList } = require('../../../models/file/fileDecorators')
const { findById, findAll, save, remove } = require('../../../models/file/fileModel')

router.get('/', (req, res) =>
  findAll(req.db, null, req.query)
    .then(decorateList)
    .then(result => res.send(result)))

const findFileById = (req, _, next, value) =>
  findById(req.db, value)
    .then(resultRow => {
      req.resultRow = resultRow
      next()
    })

router.post('/', validateCreate(), (req, res) => {
  let newItem = {
    ...req.body
  }
  return save(req.db, newItem, req.user)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.put('/:fileId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)

  return save(req.db, { ...oldItem, ...toSave }, req.user, req.params.fileId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:fileId', (req, res) => {
  const { fileId } = req.params
  return remove(req.db, fileId)
    .then(id => res.status(204).send())
})

router.param('fileId', findFileById)

module.exports = router
