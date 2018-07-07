const router = require('express-promise-router')()

router.use('/navigation', require('../intra/navigation').publicRouter)
router.use(require('../intra/siteContent').publicRouter)

module.exports = router
