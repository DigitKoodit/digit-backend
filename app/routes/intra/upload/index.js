const router = require('express-promise-router')()

router.use('/upload', require('./userManagement'))

module.exports = router
