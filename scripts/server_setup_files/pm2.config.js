module.exports = {
  apps: [
    {
      name: 'digit-api',
      cwd: '/var/www/digit_api',
      script: '/var/www/digit_api/bin/index.js',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PGDATABASE: 'digit',
        PGUSER: 'digit',
        PGPASSWORD: 'A3M.}bzL7Ugj;t@',
        PGHOST: 'localhost',
        PORT: '3002',
        SECRET_KEY: '+DgUn4RB:Rs}J%;7)tY(K@jgE6r/K6',
        FACEBOOK_ACCESS_TOKEN: '225172908136009|kPY5ms0wFLs5W5B1EuRdyHjsgWs'
      }
    }
  ]
}
