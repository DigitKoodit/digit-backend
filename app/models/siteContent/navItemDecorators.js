const toArray = require('lodash/toArray')
const sortBy = require('lodash/sortBy')

const decorate = navItem => {
  const { nav_item_id: id, parent_id: parentId, site_page_id: sitePageId } = navItem
  const { title, path, isCustom, weight } = navItem.nav_item_data

  return {
    id,
    path,
    title,
    weight,
    isCustom,
    parentId,
    sitePageId,
    subItems: []
  }
}

const decorateList = navItems =>
  navItems.map(decorate)

const constructNavigation = navItems => {
  const navigation = navItems
    .reduce((acc, item) => {
      acc[item.id] = { ...item }
      return acc
    }, {})
  const hasParent = sortBy(navItems.filter(item => item.parentId), ['weight'])
  hasParent.forEach(item => {
    const parent = navigation[item.parentId]
    if(parent) {
      navigation[item.parentId] = { ...parent, subItems: [...parent.subitems || [], item.id] }
    }
  })
  return sortBy(toArray(navigation), ['weight'])
}

module.exports = {
  decorate,
  decorateList,
  constructNavigation
}
