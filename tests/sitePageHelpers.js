const { decorateList } = require('../app/models/siteContent/sitePageDecorators')

const initialSitePages = [
  {
    site_page_id: 1,
    site_page_data: {
      title: 'Info',
      description: 'Page containing information',
      isHidden: false,
      createdAt: `2019-01-01T12:00:00+02:00`,
      updatedAt: null,
      content: 'The information that this page contains'
    }
  }
]

const selectAllSql = 'SELECT * FROM site_page ORDER BY site_page_id'
const selectPublicSql = `SELECT * FROM site_page 
  WHERE (site_page_data->>'isHidden')::boolean = false
  ORDER BY site_page_id`

const sitePagesInDb = (db, getPublished) =>
  db.any(getPublished ? selectPublicSql : selectAllSql)
    .then(decorateList)

const insertInitialSitePages = db =>
  db.tx(t =>
    t.batch(initialSitePages.map(sitePage => db.none(
      `INSERT INTO site_page (site_page_data) VALUES ($[site_page_data])`, sitePage))
    ))

const removeAllFromDb = db => db.none('TRUNCATE TABLE site_page RESTART IDENTITY CASCADE')

module.exports = {
  initialSitePages,
  sitePagesInDb,
  insertInitialSitePages,
  removeAllFromDb
}
