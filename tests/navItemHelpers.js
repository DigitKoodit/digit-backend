const { decorateList } = require('../app/models/siteContent/navItemDecorators')

const initialNavItems = [
  {
    nav_item_id: 1,
    site_page_id: null,
    parent_id: null,
    nav_item_data: {
      path: '/info',
      title: 'Information',
      isCustom: false,
      weight: 0,
      showOnNavigation: true,
      isPublished: true
    }
  }
]

const selectAllSql = 'SELECT * FROM nav_item ORDER BY nav_item_id'
const selectPublicSql = `SELECT * FROM nav_item 
  WHERE (nav_item_data->>'isPublished')::boolean = true
  ORDER BY nav_item_id`
  
const navItemsInDb = (db, getPublished) =>
  db.any(getPublished ? selectPublicSql : selectAllSql)
    .then(decorateList)

const insertInitialNavItems = db =>
  db.tx(t =>
    t.batch(initialNavItems.map(navItem => db.none(
      `INSERT INTO nav_item (nav_item_data) VALUES ($[nav_item_data])`, navItem))
    ))

const removeAllFromDb = db => db.none('TRUNCATE TABLE nav_item RESTART IDENTITY CASCADE')

module.exports = {
  initialNavItems,
  navItemsInDb,
  insertInitialNavItems,
  removeAllFromDb
}