module.exports = {
  apps: [
    {
      name: 'digit-api',
      cwd: '/var/www/digit_api',
      script: '/var/www/digit_api/bin/index.js',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PGDATABASE: 'digit',
        PGUSER: 'digit',
        PGHOST: 'ADD_ON_SERVER',
        PGPASSWORD: 'ADD_ON_SERVER',
        PGPORT: '5432',
        SECRET_KEY: 'ADD_ON_SERVER',
        FACEBOOK_ACCESS_TOKEN: 'ADD_ON_SERVER'
      }
    }
  ]
}
