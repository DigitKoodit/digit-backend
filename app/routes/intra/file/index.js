const router = require('express-promise-router')()

router.use('/upload', require('./upload'))
router.use('/', require('./file'))

module.exports = router
