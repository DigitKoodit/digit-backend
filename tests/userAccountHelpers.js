const passwordHash = require('pbkdf2-password-hash')
const jwt = require('jsonwebtoken')
const UserAccount = require('../app/models/userAccount/userAccountModel')
const UserAccountRole = require('../app/models/userAccount/userRoleModel')
const { decoratePublic } = require('../app/models/userAccount/userAccountDecorators')

// Returns promise
const generatePasswordHash = password => passwordHash.hash(password)

// sha512 of word 'password'
const dummyPassword = 'sha512$65536$64$cncBdxFI8S5o96LBgOb3YNYAfvPm036OHebJzylTNtd1wxC+WuDDxw+Pute6MlMKdKd1w/YzYUgdIKwg5nUO6A==$sxQs7Q0Z2rgWwcgelWfFxt1Y9W8LuDi9dpWVLXX9MSEHlUp/KhPeUxx7gUnEYOvozxaAib6DJcsHvzzzlnmSJg=='

const insertDefaultRolesAndAdmin = db => {
  const testUser = {
    username: 'Test',
    password: dummyPassword,
    email: 'test@example.com',
    active: true,
    userRoleId: 1,
    registrationToken: null,
    registrationTokenValid: null
  }
  const roles = [
    { name: 'admin', accessLevel: 1 },
    { name: 'user', accessLevel: 2 },
    { name: 'visitor', accessLevel: 3 }
  ]
  return db.tx(t => {
    t.batch(roles
      .map(role => UserAccountRole.create(t, role)
      ))
  })
    .then(() => db.one(`INSERT INTO user_account 
      (username, password, email, active, registration_token, registration_token_valid, user_role_id)
      VALUES ($[username], $[password], $[email], $[active], $[registrationToken], $[registrationTokenValid], $[userRoleId] ) 
      ON CONFLICT DO NOTHING RETURNING user_account_id
    `, testUser))
    .then(result => db.one('SELECT * FROM user_account WHERE user_account_id = $1', result.user_account_id))
}

const generateJwtToken = user => {
  const secret = process.env.NODE_ENV === 'test'
    ? process.env.TEST_SECRET_KEY
    : process.env.SECRET_KEY
  return jwt.sign(decoratePublic(user), secret, {
    expiresIn: '1d'
  })
}
module.exports = {
  generatePasswordHash,
  dummyPassword,
  generateJwtToken,
  insertDefaultRolesAndAdmin
}
