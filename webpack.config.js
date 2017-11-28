var path = require('path');
var Visualizer = require('webpack-visualizer-plugin');

module.exports = {
  entry: {
    "bundle": ['babel-polyfill', __dirname + '/src'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: "/assets/",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        test: /\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      },
      { test: /\.styl$/, loader: 'style-loader!css-loader!stylus-loader' }
      ,{
            test: /\.less$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }, {
                loader: "less-loader" // compiles Less to CSS
            }]
        }
      ,{
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  resolve: {
    alias: {
      pvutils: '../../../node_modules/pvutils/build/utils.js',
      pkijs: '../../../node_modules/pkijs/build/index.js'
    }
  },
  plugins: [
    new Visualizer()
  ]
};
