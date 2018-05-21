const passport = require('passport')
const passwordHash = require('pbkdf2-password-hash')
const jwt = require('jsonwebtoken')
const JwtStrategy = require('passport-jwt').Strategy
const LocalStrategy = require('passport-local').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('./models/userAccount/userAccountModel')
const { decorate } = require('./models/userAccount/userAccountDecorators')

const localOptions = {}

const localLogin = new LocalStrategy(localOptions, (username, password, done) => {
  // TODO: find out does passport validate inputs?
  return User.findOne({ username })
    .then(user => {
      return Promise.all([user, passwordHash.compare(password, user.password)])
    }).then(([result, match]) =>
      match ? done(null, decorate(result)) : done(null, false))
    .catch(done)
})

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET_KEY
}

const jwtLogin = new JwtStrategy(jwtOptions, (jwtPayload, done) => {
  User.findById(jwtPayload.id)
    .then(user =>
      user ? done(null, user) : done(null, false))
    .catch(error => done(error, false))
})

passport.use(jwtLogin)
passport.use(localLogin)

const generateToken = user => {
  return jwt.sign({ ...user }, process.env.SECRET_KEY, {
    expiresIn: '1d'
  })
}

module.exports = {
  generateToken,
  authMiddlewares: [
    passport.initialize()
  ]
}
