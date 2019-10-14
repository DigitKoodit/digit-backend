const router = require('express-promise-router')({ mergeParams: true })
const publicRouter = require('express-promise-router')({ mergeParams: true })

const { validateCreate, validateUpdate } = require('../../../models/event/eventEnrollValidators')
const { decorate, decorateList, decoratePublic, decoratePublicList } = require('../../../models/event/eventEnrollDecorators')
const { findById, findAll, save, remove, recalculateSpareEnrolls, recalculateSpareEnrollWithLimitedField } = require('../../../models/event/eventEnrollModel')
const { decorate: decorateEvent } = require('../../../models/event/eventDecorators')
const { findByIdToResultRow } = require('../../../helpers/helpers')
const { isEnrollPossible, determineIsSpare, hasStillLimits, getLimitedFieldIfEnrollMatch, hasLimitedFields } = require('../../../models/event/enrollHelpers')

router.get('/', (req, res) =>
  findAll(req.db, req.params.eventId)
    .then(decorateList)
    .then(result => res.send(result)))

router.post('/', validateCreate(), (req, res) =>
  createNewEnroll(req)
    .then(decorate)
    .then(result => res.status(201).send(result)))

const createNewEnroll = req =>
  findAll(req.db, req.params.eventId)
    .then(previousEnrollResults => {
      const event = decorateEvent(req.resultRow)
      const previousEnrolls = decorateList(previousEnrollResults)
      isEnrollPossible(event, previousEnrolls)
      const enroll = req.body
      const newEnroll = {
        ...enroll,
        isSpare: determineIsSpare(event, previousEnrolls, enroll)
      }
      return save(req.db, req.params.eventId, newEnroll)
    })
    .catch(error => {
      throw error
    })

router.put('/:eventEnrollId', validateUpdate(), (req, res) => {
  const toSave = { ...req.body }
  const oldItem = decorate(req.resultRow)
  return save(req.db, req.params.eventId, { ...oldItem, ...toSave }, req.params.eventEnrollId)
    .then(decorate)
    .then(result => res.status(201).send(result))
})

router.delete('/:eventEnrollId', (req, res) => {
  const { eventEnrollId } = req.params
  const removableEnroll = decorate(req.resultRow)

  if(removableEnroll.isSpare) {
    return remove(req.db, eventEnrollId)
      .then(() => res.status(204).send())
  }
  const event = decorateEvent(req.resultRowParent)

  return req.startTx(txDb =>
    remove(txDb, eventEnrollId)
      .then(removedResult => {
        // TODO: when and how to clear all spare spots?
        if(hasStillLimits(event)) {
          if(hasLimitedFields(event.fields)) {
            const [fieldName, fieldValue] = getLimitedFieldIfEnrollMatch(event, removableEnroll)
            if(fieldName) {
              return recalculateSpareEnrollWithLimitedField(txDb, event.id, fieldName, fieldValue)
                .then(result => {
                  return true
                })
            }
            return true
          }
        }
      })
      .then(wasSomethingUpdated => {
        if(!wasSomethingUpdated) {
          return recalculateSpareEnrolls(txDb, event.id)
        }
      }))
    .then(() => res.status(204).send())
})

const findEventEnrollById = findByIdToResultRow('Event enroll', 'eventEnrollId', findById)

router.param('eventEnrollId', findEventEnrollById)

publicRouter.get('/', (req, res) =>
  findAll(req.db, req.params.eventId, true)
    .then(decoratePublicList)
    .then(result => res.send(result)))

publicRouter.get('/:eventEnrollId', (req, res) =>
  res.send(decoratePublic(req.resultRow)))

publicRouter.post('/', validateCreate(), (req, res) =>
  createNewEnroll(req)
    .then(decoratePublic)
    .then(result => res.status(201).send(result)))

publicRouter.param('eventEnrollId', findEventEnrollById)

module.exports = {
  router,
  publicRouter
}
