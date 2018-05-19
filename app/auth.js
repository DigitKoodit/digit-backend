const passport = require('passport')
const passwordHash = require('pbkdf2-password-hash')
const jwt = require('jwt-simple')
const JwtStrategy = require('passport-jwt').Strategy
const LocalStrategy = require('passport-local').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('./models/user/userModel')

const localOptions = {}

const localLogin = new LocalStrategy(localOptions, (username, password, done) =>
  // TODO: find out does passport validate inputs?
  User.findBy({ username })
    .then(user => {
      return Promise.all([user, passwordHash.compare(password, user.password) && user.active])
    }).then(([result, match]) =>
      match ? done(null, result) : done(null, false))
    .catch(done)
)

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: process.env.SECRET_KEY
}

const jwtLogin = new JwtStrategy(jwtOptions, (jwtPayload, done) => {
  User.findById(jwtPayload.sub)
    .then(user =>
      user ? done(null, user) : done(null, false))
    .catch(error => done(error, false))
})

passport.use(jwtLogin)
passport.use(localLogin)

const generateToken = user => {
  const timestamp = new Date().getTime()
  return jwt.sign({ ...user, iat: timestamp }, process.env.SECRET_KEY, {
    expiresIn: '1h'
  })
}

module.exports = {
  generateToken,
  authMiddlewares: [
    passport.initialize()
  ]
}
