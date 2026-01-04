module.exports = {
  transform: {
    '^.+\.jsx?$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
};