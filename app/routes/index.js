const router = require('express-promise-router')()
const passport = require('passport')
const { generateToken } = require('../auth')
const { decorate: decorateUser } = require('../models/userAccount/userAccountDecorators')

const authenticateLocal = passport.authenticate('local', { session: false })
const authenticateJwt = passport.authenticate('jwt', { session: false })

router.post('/login', authenticateLocal, (req, res) => {
  res.send({
    user: decorateUser(req.user),
    token: generateToken(req.user)
  })
})

router.get('/profile', authenticateJwt, (req, res) => {
  res.send(req.user)
})

router.use('/registration', require('./auth'))

module.exports = router
