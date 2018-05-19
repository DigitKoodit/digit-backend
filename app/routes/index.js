const router = require('express-promise-router')()
const passport = require('passport')
const { generateToken } = require('../auth')
const { decorate: decorateUser } = require('../models/user/userDecorators')

const authenticateLocal = passport.authenticate('local', { session: false })
const authenticateJwt = passport.authenticate('jwt', { session: false })

router.post('/login', authenticateLocal, (req, res) => {
  decorateUser(res.user)
    .then(user =>
      res.send({
        user,
        token: generateToken(user)
      })
    )
})

router.get('/profile', authenticateJwt, (req, res) => {
  res.send(req.user)
})

router.use('/registration', require('./auth'))
