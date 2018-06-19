
const decorate = sitePage => {
  const { title, description, published, createdAt, modifiedAt, content } = sitePage.site_page_data

  return {
    id: sitePage.site_page_id,
    title,
    description,
    published,
    createdAt,
    modifiedAt,
    content
  }
}

const decorateList = sitePages =>
  sitePages.map(decorate)

module.exports = {
  decorate,
  decorateList
}
