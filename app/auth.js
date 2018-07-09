const passport = require('passport')
const passwordHash = require('pbkdf2-password-hash')
const jwt = require('jsonwebtoken')
const JwtStrategy = require('passport-jwt').Strategy
const LocalStrategy = require('passport-local').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const createError = require('http-errors')
const User = require('./models/userAccount/userAccountModel')
const { decoratePublic } = require('./models/userAccount/userAccountDecorators')

const localOptions = {}

const LOGIN_COMMON_ERROR_MESSAGE = 'Käyttäjänimi tai salasana väärin'
const LOGIN_COMMON_INACTIVE_USER_MESSAGE = 'Käyttäjää ei ole aktivoitu'

const authenticateLocal = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if(err) {
      return next(err)
    }
    if(!user) {
      return next(createError(401, info.message, {}))
    }
    res.send({
      user: decoratePublic(user),
      token: generateToken(user)
    })
  })(req, res, next)
}

const localLogin = new LocalStrategy(localOptions, (username, password, done) => {
  // TODO: find out does passport validate inputs?
  return User.findOne({ username })
    .then(user => {
      // If token exists the user hasn't been confirmed yet
      if(user.registration_token) {
        return [null, false, { message: LOGIN_COMMON_ERROR_MESSAGE }]
      } else if(!user.active) {
        return [null, false, { message: LOGIN_COMMON_INACTIVE_USER_MESSAGE }]
      }
      return Promise.all([user, passwordHash.compare(password, user.password), { message: LOGIN_COMMON_ERROR_MESSAGE }])
    }).then(([result, match, error]) =>
      match ? done(null, decoratePublic(result)) : done(null, false, error)
    )
    .catch(err =>
      done(null, false, { message: LOGIN_COMMON_ERROR_MESSAGE, error: err })
    )
})

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_KEY
}

const jwtLogin = new JwtStrategy(jwtOptions, (jwtPayload, done) =>
  User.findById(jwtPayload.id)
    .then(user =>
      user ? done(null, user) : done(null, false))
    .catch(error => done(error, false))
)

passport.use(jwtLogin)
passport.use(localLogin)

const generateToken = user => {
  return jwt.sign({ ...user }, process.env.SECRET_KEY, {
    expiresIn: '1d'
  })
}

module.exports = {
  authenticateLocal,
  generateToken,
  authMiddlewares: [
    passport.initialize()
  ]
}
