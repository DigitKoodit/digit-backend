
const decorate = sitePage => {
  const { title, description, isHidden, createdAt, updatedAt, content } = sitePage.site_page_data

  return {
    id: sitePage.site_page_id,
    title,
    description,
    isHidden,
    createdAt,
    updatedAt,
    content
  }
}

const decorateList = sitePages =>
  sitePages.map(decorate)

module.exports = {
  decorate,
  decorateList
}
