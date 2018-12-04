const router = require('express-promise-router')()

router.use('/uploads', require('./upload'))
router.use('/', require('./file'))

module.exports = router
