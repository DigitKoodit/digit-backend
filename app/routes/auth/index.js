const { Conflict, NotFound } = require('http-errors')
const router = require('express-promise-router')()
const cuid = require('cuid')
const moment = require('moment')
const nodemailer = require('nodemailer')
const passwordHash = require('pbkdf2-password-hash')

const { validateRegistrationCreate, validateRegistrationUpdate } = require('../../models/userAccount/userAccountValidator')
const { decorateRegistration } = require('../../models/userAccount/userAccountDecorators')
const { fetchUserForRegistration, save } = require('../../models/userAccount/userAccountModel')

router.post('/', validateRegistrationCreate(), (req, res) => {
  const nodeEnv = process.env.NODE_ENV
  const registrationToken = nodeEnv === 'test' ? 'testtoken' : cuid()
  const { email, username } = req.body
  return Promise.all([
    fetchUserForRegistration({ email, username }),
    passwordHash.hash(req.body.password)])
    .then(([result, passwordHash]) => {
      if(result) {
        throw new Conflict('Email or username already exists')
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
        text: 'Tervetuloa Digitin nettisivun käyttäjäksi!\n\nViimeistele liittyminen klikkaamalla oheista linkkiä: \n' + req.protocol + '://' + req.hostname + '/register/' + registrationToken + '\n\nTerveisin Digit ry'
      })
    }).then(() => {
      return res.status(201).send({ success: true })
    })
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

module.exports = router
