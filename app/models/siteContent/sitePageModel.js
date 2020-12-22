const { NotFound } = require('http-errors')
const moment = require('moment')
const isNil = require('lodash/isNil')

const SitePage = {}

SitePage.findById = (db, id, isPublished) => {
  if(!id) {
    throw new NotFound('Site SHIT page not found')
  }
  return db.one(`SELECT * FROM site_page 
    WHERE site_page_id = ${id}
    ${!isNil(isPublished)
    ? ` AND (site_page_data->>'isHidden')::boolean = false`
    : ''}
    ORDER BY site_page_id`)
}

SitePage.findAll = (db, isPublished) =>
  db.any(`SELECT * FROM site_page 
  ${!isNil(isPublished)
    ? ` WHERE (site_page_data->>'isHidden')::boolean = false`
    : ''}
    ORDER BY site_page_id`)

SitePage.save = (db, data, id) => id ? update(db, data, id) : create(db, data)

const create = (db, data) => {
  const dataWithTimestamp = {
    ...data,
    createdAt: moment().format(),
    updatedAt: null
  }
  const sql = `INSERT INTO site_page (site_page_data)
      VALUES ($1) RETURNING site_page_id`

  return db.one(sql, [dataWithTimestamp])
    .then(result => SitePage.findById(db, result.site_page_id))
}

const update = (db, data, id) => {
  const dataWithTimestamp = {
    ...data,
    updatedAt: moment().format()
  }

  const sql = `UPDATE site_page SET 
    site_page_data = $[dataWithTimestamp]
    WHERE site_page_id = $[id] 
    RETURNING site_page_id`
  const params = {
    id,
    dataWithTimestamp
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) {
        throw new NotFound('site_page not found')
      }
      return SitePage.findById(db, result.site_page_id)
    })
}

SitePage.remove = (db, id) => {
  if(!id) {
    throw new NotFound('Site page not found')
  }
  return db.one('DELETE FROM site_page WHERE site_page_id = $1 RETURNING site_page_id', id)
}

module.exports = SitePage
