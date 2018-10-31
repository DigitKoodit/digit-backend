const router = require('express-promise-router')()
const { decoratePublic } = require('../../models/userAccount/userAccountDecorators')

// request is populated with user information during jwt authentication. See routes/index.js
router.get('/profile', (req, res) => Promise.resolve(decoratePublic(req.user)).then(user => res.send(user)))
router.use('/account', require('./userManagement'))
router.use('/content', require('./siteContent').router)
router.use('/sponsor', require('./sponsor').router)
router.use('/event', require('./event').router)
router.use('/file', require('./file'))

module.exports = router
