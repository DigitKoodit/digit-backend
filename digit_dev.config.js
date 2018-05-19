module.exports = {
  apps: [
    {
      name: 'digit',
      script: '/vagrant/bin/server.js',
      cwd: '/vagrant/',
      exec_mode: 'cluster',
      watch: ['./app/**/*.js'],
      watch_options: {
        usePolling: true
      },
      env: {
        NODE_ENV: 'development',
        SECRET_KEY: 'dc94b4de1cb5e4e80be006c59752b43aaa3fc19837f2d1470a751dc28ffeed36'
      }
    }
  ]
}
