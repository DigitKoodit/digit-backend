const moment = require('moment')

const basicSiteTemplate = `# Iso otsikko

Luo sisältöä [Markdownin](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables) tai HTML:n avulla.

Voit myös sisällyttää koodia
\`\`\`jsx
const MarkdownEditor = ({ content, handleTextChange }) => {
  const decodedContent = decodeURI(content)
  return (
    <div className='markdown-area margin-top-1'>
      <div className='row'>
        <div className='col-xs-6'>
          <p>Sisältö</p>
          <Textarea
            className='text-input'
            onTextChange={handleTextChange}
            value={decodedContent}
          />
        </div>
        <div className=' col-xs-6'>
          <p>Esikatselu</p>
          <ReactMarkdown
            className={'markdown-area'}
            source={decodedContent}
            escapeHtml={false}
            renderers={{ code: CodeBlock }}
          />
        </div>
      </div>
    </div>
  )
}
\`\`\`
Onnea matkaan!

<img src='https://i.imgur.com/ek2vrBe.jpg' alt='thumbs-up'>`

const insertPageTemplate = {
  query: 'INSERT INTO site_page(site_page_data) VALUES($1)',
  values: [
    [{
      title: 'Sivupohja',
      description: 'Peruspohja',
      isHidden: false,
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
  up: (applyInTransaction) =>
    applyInTransaction(sqlQueries),
  down: (applyInTransaction) =>
    applyInTransaction(sqlQueriesDown)
}
