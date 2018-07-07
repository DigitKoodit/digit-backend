const router = require('express-promise-router')()
const { decoratePublic } = require('../../models/userAccount/userAccountDecorators')

// request is populated with user information during jwt authentication. See routes/index.js
router.get('/profile', (req, res) => Promise.resolve(decoratePublic(req.user)).then(user => res.send(user)))
router.use('/accounts', require('./userManagement'))
router.use('/cms/content', require('./siteContent').router)

module.exports = router
