const moment = require('moment')

const basicSiteTemplate = `# Iso otsikko

Luo sisältöä [Markdownin](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables) tai HTML:n avulla.

Onnea matkaan!

<img src='https://i.imgur.com/ek2vrBe.jpg' alt='thumbs-up'>`

const insertPageTemplate = {
  query: 'INSERT INTO site_page(site_page_data) VALUES($1)',
  values: [
    [{
      title: 'Sivupohja',
      description: 'Peruspohja',
      published: true,
      createdAt: moment().format(),
      updatedAt: null,
      content: encodeURI(basicSiteTemplate)
    }]
  ]
}

const sqlQueries = [
  `CREATE TABLE site_page (
    site_page_id SERIAL PRIMARY KEY,
    site_page_data JSONB NOT NULL
  )`,
  insertPageTemplate
]

const sqlQueriesDown = [
  'DROP TABLE site_page'
]

module.exports = {
  up: (applyInTransaction, client) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction, client) =>
    applyInTransaction(sqlQueriesDown)
}
