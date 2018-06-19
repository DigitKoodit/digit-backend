const { NotFound } = require('http-errors')
const router = require('express-promise-router')()
const cuid = require('cuid')
const moment = require('moment')
const nodemailer = require('nodemailer')
const passwordHash = require('pbkdf2-password-hash')
const createError = require('http-errors')

const { validateRegistrationCreate, validateRegistrationUpdate } = require('../../models/userAccount/userAccountValidators')
const { decorateRegistration } = require('../../models/userAccount/userAccountDecorators')
const { fetchUserForRegistration, save } = require('../../models/userAccount/userAccountModel')

const CONFLICT_REGISTRATION_COMMON_MESSAGE = 'Ongelmia rekisteröitymisessä'
const CONFLICT_REGISTRATION_USERNAME_MESSAGE = 'Käyttäjänimi varattu'
const CONFLICT_REGISTRATION_EMAIL_MESSAGE = 'Sähköpostisoite jo käytössä'

router.post('/', validateRegistrationCreate(), (req, res) => {
  const nodeEnv = process.env.NODE_ENV
  const registrationToken = nodeEnv === 'test' ? 'testtoken' : cuid()
  const { email, username } = req.body
  return Promise.all([
    fetchUserForRegistration({ email, username }),
    passwordHash.hash(req.body.password)])
    .then(([result, passwordHash]) => {
      if(result && result.length > 0) {
        const errors = []
        result.forEach(user => {
          if(user.username === username) {
            errors.push({ param: 'username', msg: CONFLICT_REGISTRATION_USERNAME_MESSAGE })
          }
          if(user.email === email) {
            errors.push({ param: 'email', msg: CONFLICT_REGISTRATION_EMAIL_MESSAGE })
          }
        })
        return Promise.reject(errors)
      }
      const newUser = {
        ...req.body,
        password: passwordHash,
        registrationToken,
        registrationTokenValid: moment().add(2, 'days')
      }
      return save(newUser)
    })
    .then(saved => {
      let mailTransporter
      if(nodeEnv === 'test' || nodeEnv === 'development') {
        mailTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'pwkoixh3plfz2yrk@ethereal.email',
            pass: 'cvECMQxAfxU56dbsqC'
          }
        })
      } else {
        // TODO: mailgun delivery
        return
      }
      return mailTransporter.sendMail({
        from: 'Digit ry <sami@nieminen.fi>',
        sender: 'sami@nieminen.fi',
        to: email,
        subject: 'Rekisteröityminen Digit-intraan',
        text: 'Tervetuloa Digitin nettisivun käyttäjäksi!\n\nViimeistele liittyminen klikkaamalla oheista linkkiä: \n' + req.protocol + '://' + req.hostname + '/registration/' + registrationToken + '\n\nTerveisin Digit ry'
      })
    }).then(() => {
      return res.status(201).send({ success: true })
    })
    .catch(handleRegistrationError)
})

router.put('/', validateRegistrationUpdate(), (req, res) =>
  fetchUserForRegistration({ email: req.body.email, registrationToken: req.body.registrationToken })
    .then((userResult) => {
      if(!userResult) {
        throw new NotFound('User not found')
      }
      const data = {
        ...decorateRegistration(userResult),
        registrationToken: null,
        registrationTokenValid: null
      }
      return save(data, userResult.id)
    })
    .then(saved => {
      res.send({ success: true })
    })
)

const handleRegistrationError = err => {
  throw createError(400, CONFLICT_REGISTRATION_COMMON_MESSAGE, { ...err, data: err })
}

module.exports = router
