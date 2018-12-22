const router = require('express-promise-router')()

router.use('/navigation', require('../intra/navigation').publicRouter)
router.use('/sponsors', require('../intra/sponsor').publicRouter)
router.use('/events', require('../intra/event').publicRouter)
router.use(require('../intra/siteContent').publicRouter)

module.exports = router
