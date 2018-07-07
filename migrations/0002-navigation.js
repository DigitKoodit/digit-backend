
const insertNavitems = {
  query: 'INSERT INTO nav_item(parent_id, site_page_id, nav_item_data) VALUES($[parentId], $[sitePageId],$[data])',
  values: [{
    parentId: null,
    sitePageId: null,
    data: {
      path: '/',
      title: 'Etusivu',
      weight: 0,
      isCustom: true,
      isVisible: true
    }
  }, {
    parentId: null,
    sitePageId: null,
    data: {
      path: '/viralliset',
      title: 'Viralliset',
      weight: 1,
      isCustom: true,
      isVisible: true
    }
  }, {
    parentId: 2,
    sitePageId: 1,
    data: {
      path: '/esittely',
      title: 'Esittely',
      weight: 0,
      isCustom: true,
      isVisible: true
    }
  }]
}

const sqlQueries = [
  `CREATE TABLE nav_item (
    nav_item_id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES nav_item ON DELETE SET NULL ON UPDATE CASCADE,
    site_page_id INT REFERENCES site_page ON DELETE SET NULL ON UPDATE CASCADE,
    nav_item_data JSONB NOT NULL
  )`,
  insertNavitems
]

const sqlQueriesDown = [
  'DROP TABLE nav_item'
]

module.exports = {
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
