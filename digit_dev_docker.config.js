module.exports = {
  apps: [
    {
      name: 'digit',
      script: '/bin/index.js',
      cwd: '/',
      exec_mode: 'fork',
      watch: ['./app/**/*.js'],
      watch_options: {
        usePolling: true
      },
      env: {
        NODE_ENV: 'development',
        SECRET_KEY:
          'dc94b4de1cb5e4e80be006c59752b43aaa3fc19837f2d1470a751dc28ffeed36',
        PORT: 3001,
        TEST_PORT: 3031,
        TEST_JWT_TOKEN: '6KVLFMDQJ1',
        TEST_SECRET_KEY: 'UA08KVNXRKBY0B6793BW',
        PGHOST: 'db'
      },
      node_args: '--inspect=0.0.0.0:9230'
    }
  ]
};
