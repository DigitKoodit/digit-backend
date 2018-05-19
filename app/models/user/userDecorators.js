const decorate = user => ({
  id: user.user_id,
  username: user.username,
  email: user.email
})

const decorateList = users =>
  users.map(decorate)

module.exports = {
  decorate,
  decorateList
}
