module.exports = {
  apps: [
    {
      name: 'cookbook-backend',
      cwd: './backend',
      script: 'src/index.js',
      interpreter: 'node',
      interpreter_args: '--watch',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
    },
    {
      name: 'cookbook-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/vite',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
