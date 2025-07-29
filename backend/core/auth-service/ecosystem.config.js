module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: 'dist/index.production.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Monitoring
      pmx: true,
      monitoring: true,
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Performance
      node_args: '--max-old-space-size=1024',
      
      // Security
      uid: 'ultramarket',
      gid: 'ultramarket',
      
      // Environment variables
      env_file: './env.production',
      
      // Advanced configuration
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // Metrics
      merge_logs: true,
      log_type: 'json',
      
      // Error handling
      source_map_support: true,
      
      // Development
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git',
        '*.log'
      ],
      
      // Notifications
      notify: true,
      
      // Scripts
      pre_start: 'npm run build',
      post_start: 'npm run health:check',
      pre_stop: 'npm run health:check',
      post_stop: 'echo "Service stopped"',
      
      // Cron jobs
      cron_restart: '0 2 * * *', // Restart at 2 AM daily
      
      // Memory management
      max_memory_restart: '1G',
      min_uptime: '10s',
      
      // Error handling
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      
      // Process management
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      
      // Environment specific
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        HOST: 'localhost'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      }
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ultramarket',
      host: 'api.ultramarket.com',
      ref: 'origin/main',
      repo: 'https://github.com/ultramarket/auth-service.git',
      path: '/var/www/auth-service',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'ultramarket',
      host: 'staging.ultramarket.com',
      ref: 'origin/develop',
      repo: 'https://github.com/ultramarket/auth-service.git',
      path: '/var/www/auth-service-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    port: 9615,
    web_interface: {
      port: 9615,
      address: 'localhost'
    }
  },

  // Logging configuration
  log: {
    level: 'info',
    format: 'json',
    timestamp: true
  },

  // Performance configuration
  performance: {
    profiling: false,
    heap_snapshot: false,
    cpu_profiling: false
  },

  // Security configuration
  security: {
    enable_source_map_support: true,
    enable_notify: true,
    enable_monitoring: true
  },

  // Health check configuration
  health_check: {
    enabled: true,
    url: 'http://localhost:3001/health',
    interval: 30000,
    timeout: 5000,
    unhealthy_threshold: 3,
    healthy_threshold: 2
  },

  // Metrics configuration
  metrics: {
    enabled: true,
    port: 9090,
    path: '/metrics'
  },

  // Graceful shutdown configuration
  graceful_shutdown: {
    enabled: true,
    timeout: 30000,
    signals: ['SIGTERM', 'SIGINT']
  },

  // Auto-scaling configuration
  auto_scaling: {
    enabled: true,
    min_instances: 2,
    max_instances: 8,
    cpu_threshold: 80,
    memory_threshold: 80
  },

  // Backup configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 7, // Keep 7 days
    path: './backups'
  },

  // Notification configuration
  notifications: {
    enabled: true,
    webhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
    events: ['restart', 'error', 'crash']
  }
}; 