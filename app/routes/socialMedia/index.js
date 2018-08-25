
const urlTemplate = require('url-template')
const fetch = require('node-fetch')
const router = require('express-promise-router')({ mergeParams: true })

const accessToken = process.env.FACEBOOK_ACCESS_TOKEN
const fbGraphApiBase = 'https://graph.facebook.com/v3.1/digitry/{path}{?fields,limit,access_token}'
const basics = {
  path: '',
  fields: ['cover', 'picture'],
  access_token: accessToken
}
const posts = {
  path: 'posts',
  limit: 6,
  fields: ['id', 'name', 'description', 'picture', 'full_picture', 'permanent_url', 'created_time'],
  access_token: accessToken
}

const graphApiTemplate = urlTemplate.parse(fbGraphApiBase)
router.get('/', (req, res) =>
  fetch(graphApiTemplate.expand(basics))
    .then(res => res.json())
    .then(page =>
      fetch(graphApiTemplate.expand(posts))
        .then(res => res.json())
        .then(posts => ({ page, posts }))
    )
    .then(result => res.send(result))
)

module.exports = router
