const path = require('path');

module.exports = {
  resolve: {
    alias: {
      Inner: path.resolve(__dirname, 'subfolder/innerFolder/')
    }
  }
}
