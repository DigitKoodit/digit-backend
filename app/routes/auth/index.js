const router = require('express-promise-router')()
const cuid = require('cuid')
const moment = require('moment')
const nodemailer = require('nodemailer')
const passwordHash = require('pbkdf2-password-hash')

const { validateRegistrationCreate, validateRegistrationUpdate } = require('../../models/user/userValidator')
const { fetchUserForRegistration, save } = require('../../models/user/userModel')

router.post('/', validateRegistrationCreate(), (req, res) => {
  const nodeEnv = process.env.NODE_ENV
  const token = nodeEnv === 'test' ? 'testtoken' : cuid()
  const { email } = req.body
  return fetchUserForRegistration({ email: email })
    .then(userResult => {
      const data = {
        id: userResult.user_id,
        token,
        tokenValidUntil: moment().add(2, 'days')
      }
      return save(data, userResult.user_id)
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
        text: 'Tervetuloa Digitin nettisivun käyttäjäksi!\n\nPääset luomaan käyttäjätunnuksen avaamalla seuraavan linkin selaimessasi: \n' + req.protocol + '://' + req.hostname + '/register/' + token + '\n\nTerveisin Digit ry'
      })
    }).then(() => {
      return res.status(201).send({ success: true })
    })
})

router.put('/', validateRegistrationUpdate(), (req, res) =>
  Promise.all([
    fetchUserForRegistration({ email: req.body.email, token: req.body.token }),
    passwordHash.hash(req.body.password)
  ])
    .then(([userResult, passwordHash]) => {
      const data = {
        id: userResult.user_id,
        username: req.body.username,
        password: passwordHash,
        token: null,
        tokenValidUntil: null
      }
      return save(data, userResult.user_id)
    })
    .then(saved => {
      res.send({ success: true })
    })
)
