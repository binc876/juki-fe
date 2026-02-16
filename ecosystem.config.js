module.exports = {
  apps: [
    {
      name: 'juki-fe',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/juki-fe/juki-fe',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        NEXT_PUBLIC_API_URL: '/api/proxy'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};