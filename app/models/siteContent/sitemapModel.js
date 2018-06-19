const { NotFound } = require('http-errors')
const { db } = require('../../../db/pgp')

const Sitemap = {}

Sitemap.findById = id => {
  if(!id) {
    throw new NotFound('Sitemap item not found')
  }
  return db.one('SELECT * FROM sitemap WHERE sitemap_id = $1', id)
}

Sitemap.findAll = () => db.any('SELECT * FROM sitemap')

Sitemap.save = (data, id) => id ? update(data, id) : create(data)

const create = ({ sitePageId, parentId, ...data }) => {
  const sql = `INSERT INTO sitemap (site_page_id, parent_id, sitemap_data)
      VALUES ($[sitePageId],$[parentId], $[dataWithTimestamp])`
  const params = { sitePageId, parentId, data }
  return db.one(sql, params)
    .then(result => Sitemap.findById(result.sitemap_id))
}

const update = ({ id, sitePageId, parentId, ...data }) => {
  const sql = `UPDATE sitemap 
  SET site_page_id = $[sitePageId], parent_id = $[parentId], [sitemap_data = $[data],
  WHERE sitemap_id = $[id] RETURNING sitemap_id`
  const params = {
    id,
    sitePageId,
    parentId,
    data
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) { throw new NotFound('sitemap not found') }
      return result.sitemap_id
    })
}

Sitemap.remove = id => {
  if(!id) { throw new NotFound('Sitemap item not found') }
  return db.one('DELETE FROM sitemap WHERE sitemap_id = $1 RETURNING sitemap_id', id)
}

module.exports = Sitemap
