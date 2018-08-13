const { NotFound } = require('http-errors')
const moment = require('moment')
const { db } = require('../../../db/pgp')

const SitePage = {}

SitePage.findById = id => {
  if(!id) {
    throw new NotFound('Site page not found')
  }
  return db.one(`SELECT * FROM site_page WHERE site_page_id = ${id}`)
}

SitePage.findAll = () => db.any('SELECT * FROM site_page')

SitePage.save = (data, id) => id ? update(data, id) : create(data)

const create = data => {
  const dataWithTimestamp = {
    ...data,
    createdAt: moment().format(),
    updatedAt: null
  }
  const sql = `INSERT INTO site_page (site_page_data)
      VALUES ($1) RETURNING site_page_id`

  return db.one(sql, [dataWithTimestamp])
    .then(result => SitePage.findById(result.site_page_id))
}

const update = (data, id) => {
  const dataWithTimestamp = {
    ...data,
    updatedAt: moment().format()
  }

  const sql = `UPDATE site_page SET 
    site_page_data = $[dataWithTimestamp]
  WHERE site_page_id = $[id] RETURNING site_page_id`
  const params = {
    id,
    dataWithTimestamp
  }
  return db.one(sql, params)
    .then(result => {
      if(!result) {
        throw new NotFound('site_page not found')
      }
      return result.site_page_id
    })
    .then(SitePage.findById)
}

SitePage.remove = id => {
  if(!id) {
    throw new NotFound('Site page not found')
  }
  return db.one('DELETE FROM site_page WHERE site_page_id = $1 RETURNING site_page_id', id)
}

module.exports = SitePage
