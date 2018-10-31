const router = require('express-promise-router')({ mergeParams: true })
const { NotFound } = require('http-errors')
const multer = require('multer')
const storage = multer.memoryStorage()

const maxFileSize = 5000000
const upload = multer({ storage, limits: { fileSize: maxFileSize } })
const fileUpload = upload.fields([{ name: 'uploads', maxCount: 10 }])

router.post('/', fileUpload, (req, res) => {
  const files = req.files.uploads
  console.log(files)
  if(!files) {
    throw new NotFound('File not found')
  }
  res.send({ message: 'Succes' })
})

module.exports = router
