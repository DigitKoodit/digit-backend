const router = require('express-promise-router')()
const { decoratePublic } = require('../../models/userAccount/userAccountDecorators')

// request is populated with user information during jwt authentication. See routes/index.js
router.get('/profiles', (req, res) => Promise.resolve(decoratePublic(req.user)).then(user => res.send(user)))
router.use('/navigation', require('./navigation').router)
router.use('/accounts', require('./userManagement'))
router.use('/sponsors', require('./sponsor').router)
router.use('/events', require('./event').router)
router.use('/files', require('./file'))
router.use('/pages', require('./siteContent').router)

module.exports = router
