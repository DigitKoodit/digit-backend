const router = require('express-promise-router')({ mergeParams: true })

const { validateUpdate } = require('../../../models/userAccount/userRoleValidators')
const { decorate, decorateList } = require('../../../models/userAccount/userRoleDecorators')
const { findOne, findAll, save, remove } = require('../../../models/userAccount/userRoleModel')

router.get('/', (req, res) => {
  findAll()
    .then(decorateList)
    .then(result => res.send(result))
})

router.param('userRoleId', (req, _, next, value) => {
  return findOne(value)
    .then(resultUserRole => {
      req.resultUserRole = resultUserRole
      next()
    })
})

router.get('/:userRoleId', (req, res) => {
  return res.send(req.resultSite)
})

router.put('/:userRoleId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultUserRole)
  return save({ ...oldItem, ...toSave }, req.params.userRoleId)
    .then(decorate)
    .then(result => res.send(result))
})

router.delete('/:userRoleId', (req, res) => {
  const { userRoleId } = req.params
  return remove(userRoleId)
    .then(id => res.status(204).send())
})

module.exports = router
