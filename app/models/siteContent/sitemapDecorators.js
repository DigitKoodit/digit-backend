
const decorate = sitemap => {
  const { title, path, published, parent, isCustom } = sitemap.sitemap_data

  return {
    id: sitemap.sitemap_id,
    title,
    path,
    published,
    parent,
    isCustom
  }
}

const decorateList = sitemaps =>
  sitemaps.map(decorate)

module.exports = {
  decorate,
  decorateList
}
