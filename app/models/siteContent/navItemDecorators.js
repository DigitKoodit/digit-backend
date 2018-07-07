const decorate = navItem => {
  const { nav_item_id: id, parent_id: parentId, site_page_id: sitePageId } = navItem
  const { title, path, isCustom, weight, isVisible } = navItem.nav_item_data

  return {
    id,
    path,
    title,
    weight,
    isCustom,
    parentId,
    isVisible,
    sitePageId
  }
}

const decorateList = navItems =>
  navItems.map(decorate)

module.exports = {
  decorate,
  decorateList
}
