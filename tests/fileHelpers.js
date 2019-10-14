const { decorateList } = require('../app/models/file/fileDecorators')
const rimraf = require('rimraf')

const initialFiles = [
  {
    file_id: 1,
    created_by: 1,
    file_data: {
      path: 'uploads/20181128/x.jpg',
      size: 1026604,
      filename: 'x.jpg',
      mimetype: 'image/jpeg',
      createdAt: '2018-11-28T00:00:00+02:00',
      description: ''
    }
  },
  {
    file_id: 2,
    created_by: 1,
    file_data: {
      path: 'uploads/20181129/x2.jpg',
      size: 1026604,
      filename: 'x2.jpg',
      mimetype: 'image/jpeg',
      createdAt: '2018-11-29T00:00:00+02:00',
      description: ''
    }
  }
]
const filesInDb = db =>
  db.any('SELECT * FROM file')
    .then(decorateList)

const insertInitialFiles = db =>
  db.tx(t =>
    t.batch(initialFiles.map(file => db.none(
      `INSERT INTO file 
      (created_by, file_data)
      VALUES ($[created_by], $[file_data])
      `, file))
    ))

const clearUploadsTestFolder = () =>
  new Promise(resolve => {
    const uploadFolder = 'uploads_test'
    rimraf(uploadFolder, resolve)
  })

const removeAllFromDb = db => db.none('TRUNCATE TABLE file RESTART IDENTITY CASCADE')

module.exports = {
  initialFiles,
  filesInDb,
  insertInitialFiles,
  removeAllFromDb,
  clearUploadsTestFolder
}
