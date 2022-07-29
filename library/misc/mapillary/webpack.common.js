const path = require('path');

module.exports = {
    entry: './src/mapillary.js',
    output: {
        filename: './dist/mapillary.js',
        path: path.resolve(__dirname, 'dist')
    }
};
