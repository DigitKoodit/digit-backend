const router = require('express-promise-router')({ mergeParams: true })

const { validateUpdate } = require('../../../models/userAccount/userAccountValidators')
const { decoratePublic, decorate, decorateList } = require('../../../models/userAccount/userAccountDecorators')
const { findById, findAll, save, remove } = require('../../../models/userAccount/userAccountModel')

router.get('/', (req, res) => {
  findAll(req.db)
    .then(decorateList)
    .then(result => res.send(result))
})

router.put('/:userAccountId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultUserAccount)
  return save(req.db, { ...oldItem, ...toSave }, req.params.userAccountId)
    .then(decoratePublic)
    .then(result => res.send(result))
})

router.delete('/:userAccountId', (req, res) => {
  const { userAccountId } = req.params
  return remove(req.db, userAccountId)
    .then(id => res.status(204).send())
})

router.param('userAccountId', (req, _, next, value) => {
  return findById(req.db, value)
    .then(decorate)
    .then(resultUserAccount => {
      req.resultUserAccount = resultUserAccount
      next()
    })
})

router.use('/roles', require('./userRole'))

router.get('/:userAccountId', (req, res) => {
  return res.send(req.resultUserAccount)
})

module.exports = router
