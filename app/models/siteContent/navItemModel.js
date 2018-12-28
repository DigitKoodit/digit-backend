const { NotFound } = require('http-errors')
const isNil = require('lodash/isNil')
const { db } = require('../../../db/pgp')

const navItem = {}

navItem.findById = id => {
  if(!id) {
    throw new NotFound('Navigation item not found')
  }
  return db.one('SELECT * FROM nav_item WHERE nav_item_id = $1', id)
}

navItem.findAll = isPublished => db.any(`SELECT * FROM nav_item ${!isNil(isPublished) ? `WHERE (nav_item_data->>'isPublished')::boolean = true` : ''}`)

navItem.save = (data, id) => id ? update(data, id) : create(data)

const create = ({ sitePageId, parentId, ...data }) => {
  const sql = `INSERT INTO nav_item (site_page_id, parent_id, nav_item_data)
      VALUES ($[sitePageId],$[parentId], $[data]) RETURNING nav_item_id`
  const params = { sitePageId, parentId, data }
  return db.one(sql, params)
    .then(result => navItem.findById(result.nav_item_id))
}

const update = ({ id, sitePageId, parentId, ...data }) => {
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
      return navItem.findById(result.nav_item_id)
    })
}

navItem.remove = id => {
  if(!id) { throw new NotFound('Navigation item item not found') }
  return db.one('DELETE FROM nav_item WHERE nav_item_id = $1 RETURNING nav_item_id', id)
}

module.exports = navItem
