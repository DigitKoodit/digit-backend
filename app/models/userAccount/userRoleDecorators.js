const decorate = userRole => {
  const { name, accessLevel } = userRole.user_role_data
  return {
    id: userRole.user_role_id,
    name,
    accessLevel
  }
}

const decorateList = userRoles =>
  userRoles.map(decorate)

module.exports = {
  decorateList,
  decorate
}
