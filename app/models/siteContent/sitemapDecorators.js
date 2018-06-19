const mapKeys = require('lodash/mapKeys')
const sort = require('lodash/sort')

const decorate = sitemap => {
  const { sitemap_id: id, parent_id: parentId, site_page_id: sitePageId } = sitemap
  const { title, path, isCustom, weight } = sitemap.sitemap_data

  return {
    id,
    path,
    title,
    isCustom,
    parentId,
    sitePageId,
    weight
  }
}

const decorateList = sitemaps =>
  sitemaps.map(decorate)

const constructNavigation = sitemaps => {
  const topLevel = mapKeys(sitemaps.filter(item => !item.parentId), key => key)
  const rest = sort(sitemaps.filter(item => item.parentId), ['weight'])
  rest.forEach(item => {
    const parent = topLevel[item.parentId]
    if(parent) {
      topLevel[item.parentId] = { ...parent, subItems: [...parent.subitems, item] }
    }
  })
  return sort(topLevel, ['weight'])
}

module.exports = {
  decorate,
  decorateList,
  constructNavigation
}
