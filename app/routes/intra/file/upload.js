const router = require('express-promise-router')({ mergeParams: true })
const path = require('path')
const { NotFound } = require('http-errors')
const moment = require('moment')
const multer = require('multer')
const mkdirp = require('mkdirp')

const { db } = require('../../../../db/pgp')
const { saveBatch } = require('../../../models/file/fileModel')
const { decorateInitialList, decorateList } = require('../../../models/file/fileDecorators')

const maxFileSize = 5 * 1024 * 1024
const badCharacters = /[ \\:"*?<>|]+/g

const uploadFolder = process.env.NODE_ENV === 'test' ? 'uploads_test' : 'uploads'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = moment().format('YYYYMMDD')
    const dir = path.join(uploadFolder, date)
    mkdirp(dir, err => cb(err, dir))
  },
  filename: (req, file, cb) => {
    const filename = file.originalname.replace(badCharacters, '_')
    cb(null, filename)
  }
})

const fileFilter = (req, file, cb) => {
  // const filename = file.originalname.replace(badCharacters, '_')
  // findByName(filename)
  //   .then(file => {
  //     cb(new BadRequest(`File with same name ${file.filename} already exists`))
  //   })
  //   .catch(() => // file with same name doesn't exist, continue
  cb(null, true)
  // )
}

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter
})

const fileUpload = upload.fields([{ name: 'uploads', maxCount: 10 }])

router.post('/', fileUpload, (req, res) => {
  const files = req.files.uploads
  if(!files) {
    throw new NotFound('File not found')
  }
  return saveBatch(db, decorateInitialList(files), req.user)
    .then(decorateList)
    .then(savedFiles => res.status(201).send(savedFiles))
})

module.exports = router
