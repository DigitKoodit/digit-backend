const router = require('express-promise-router')()
const passport = require('passport')
const { authenticateLocal } = require('../auth')
const { validateLogin } = require('../models/userAccount/userAccountValidators')
const authenticateJwt = passport.authenticate('jwt', { session: false })

router.post('/login', validateLogin(), authenticateLocal)
router.get('/profile', authenticateJwt, (req, res) => res.send(req.user))
router.use('/content', require('./siteContent'))
router.use('/registration', require('./auth'))

module.exports = router
