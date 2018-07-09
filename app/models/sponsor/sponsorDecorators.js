const decorate = sponsor => {
  const { sponsor_id: id } = sponsor
  const { name, link, logo, description, activeAt, activeUntil } = sponsor.sponsor_data

  return {
    id,
    name,
    link,
    logo,
    description,
    activeAt,
    activeUntil
  }
}

const decorateList = sponsors =>
  sponsors.map(decorate)

module.exports = {
  decorate,
  decorateList
}
