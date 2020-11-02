const { NotFound } = require('http-errors')
const isNil = require('lodash/isNil')

const navItem = {}

navItem.findById = (db, id, isPublished) => {
  if(!id) {
    throw new NotFound('Navigation item not found')
  }
  return db.one(`SELECT * FROM nav_item 
    WHERE nav_item_id = $1 
    ${!isNil(isPublished)
    ? ` AND (nav_item_data->>'isPublished')::boolean = true`
    : ''}
    ORDER BY nav_item_id`, id)
}

navItem.findAll = (db, isPublished) => db.any(`SELECT * FROM nav_item ${!isNil(isPublished)
  ? `WHERE (nav_item_data->>'isPublished')::boolean = true`
  : ''}
    ORDER BY nav_item_id`)

navItem.save = (db, data, id) => id ? update(db, data, id) : create(db, data)

const create = (db, { sitePageId, parentId, ...data }) => {
  const sql = `INSERT INTO nav_item (site_page_id, parent_id, nav_item_data)
      VALUES ($[sitePageId],$[parentId], $[data]) RETURNING nav_item_id`
  const params = { sitePageId, parentId, data }
  return db.one(sql, params)
    .then(result => navItem.findById(db, result.nav_item_id))
}

const update = (db, { id, sitePageId, parentId, ...data }) => {
  const sql = `UPDATE nav_item 
  SET parent_id = $[parentId], site_page_id = $[sitePageId], nav_item_data = $[data]
  WHERE nav_item_id = $[id] RETURNING nav_item_id`
  const params = {
    id,
    sitePageId,
    parentId,
    data
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) { throw new NotFound('Navigation item not found') }
      return navItem.findById(db, result.nav_item_id)
    })
}

navItem.remove = (db, id) => {
  if(!id) { throw new NotFound('Navigation item item not found') }
  return db.one('DELETE FROM nav_item WHERE nav_item_id = $1 RETURNING nav_item_id', id)
}

module.exports = navItem
