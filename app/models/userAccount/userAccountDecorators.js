const decoratePublic = user => ({
  id: user.user_account_id,
  username: user.username,
  email: user.email,
  active: user.active,
  roleId: user.user_role_id
})

const decorate = user => ({
  id: user.user_account_id,
  username: user.username,
  email: user.email,
  active: user.active,
  password: user.password,
  registrationToken: user.registration_token,
  registrationTokenValid: user.registration_token_valid
})

const decorateList = users =>
  users.map(decoratePublic)

module.exports = {
  decoratePublic,
  decorateList,
  decorate
}
