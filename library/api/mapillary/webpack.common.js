const path = require('path');

module.exports = {
    entry: './src/mapillary.js',
    output: {
        filename: 'mapillary.js',
        path: path.resolve(__dirname, 'dist')
    }
};
