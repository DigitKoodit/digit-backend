const router = require('express-promise-router')({ mergeParams: true })

const { validateUpdate } = require('../../models/userAccount/userAccountValidators')
const { decoratePublic } = require('../../models/userAccount/userAccountDecorators')
const { findOne, findAll, save, remove } = require('../../models/userAccount/userAccountModel')

router.get('/', (req, res) => {
  findAll()
    .then(result => res.send(result))
})

router.param('userAccountId', (req, _, next, value) => {
  return findOne(value)
    .then(resultUserAccount => {
      req.resultUserAccount = resultUserAccount
      next()
    })
})

router.get('/:userAccountId', (req, res) => {
  return res.send(req.resultSite)
})

router.put('/:userAccountId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decoratePublic(req.resultUserAccount)
  return save({ ...oldItem, ...toSave }, req.params.userAccountId)
    .then(decoratePublic)
    .then(result => res.send(result))
})

router.delete('/:userAccountId', (req, res) => {
  const { userAccountId } = req.params
  return remove(userAccountId)
    .then(id => res.status(204).send())
})

module.exports = router
