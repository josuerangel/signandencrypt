const path = require('path');
var webpack = require('webpack');
var CompressionPlugin = require('compression-webpack-plugin');


module.exports = {
  entry: {
    "app.min": [__dirname + '/src'],
    "boxencrypt-standalone.min": [__dirname + '/src/components/wrapper/standalone-box-encrypt.js'],
    "boxdecrypt-standalone.min": [__dirname + '/src/components/wrapper/standalone-box-decrypt.js'],
  },
  output: {
    path: path.resolve(__dirname, 'bundles'),
    filename: '[name].js',
    publicPath: '/bundles/',
    library: 'sindejs',
    libraryTarget: 'umd'
  },
  devtool: "cheap-module-source-map",
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
  plugins: [
    // new webpack.LoaderOptionsPlugin({
    //   minimize: true,
    //   debug: false
    // }),
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      beatify:false,
      comments: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true
      },
      compress:{
        screw_ie8: true,
        warnings: false,
        // drop_console: true
      }
   }),
   // new webpack.optimize.DedupePlugin(),
   new webpack.optimize.AggressiveMergingPlugin()
  ],
  resolve: {
    alias: {
      'react': path.join(__dirname, 'node_modules', 'react')
    },
    extensions: ['.js', '.jsx', '.styl']
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'jsrsasign': 'jsrsasign'
  }
};
