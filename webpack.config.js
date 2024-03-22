const { join } = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const DotenvWebpackPlugin = require('dotenv-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = ({ mode }) => {
  const rootFolder = 'src';
  const outputFolder = 'dist';
  const isDev = mode === 'development';
  console.log('Is development:', isDev);

  const pathToRoot = join(__dirname, rootFolder);

  return {
    mode: mode,
    context: pathToRoot,
    entry: { index: join(pathToRoot, 'index.ts') },
    devtool: 'source-map' /* chooseDevOrProd('source-map', false, isDev) */,
    optimization: optimization(isDev),

    output: {
      path: join(__dirname, outputFolder),
      filename: filename('script', 'js', isDev),
      sourceMapFilename: 'maps/[file].map',
      clean: true //Cleans the folder before packing
    },

    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': pathToRoot,
        '@scripts': join(pathToRoot, 'scripts')
      }
    },

    devServer: {
      hot: true, // * Hot Module Replacement
      port: 8080,
      compress: true,
      static: {
        // * For live watch
        watch: true,
        directory: pathToRoot
      }
    },

    plugins: [
      new DotenvWebpackPlugin(), // * If you need global variables in the .env file
      new HTMLWebpackPlugin({
        filename: 'index.html',
        template: join(pathToRoot, 'index.html'),
        minify: false,
        inject: 'body',
        chunks: ['index'] // * binds to entry js. If you want a couple of pages copy the same plugin and bind it to another entry
      }),
      new MiniCssExtractPlugin({
        filename: filename('styles', 'css', isDev)
      })
      /* new CopyWebpackPlugin({
      patterns: [
        {
          from: "assets/images/*",
          to: join(__dirname, outputFolder, "assets/images/[name][ext]"),
        },
      ],
    }), */
    ],

    module: {
      rules: [
        // * replaces all images, compresses depending on the mode
        {
          test: /\.html$/i,
          loader: 'html-loader'
        },
        {
          test: /\.(sa|sc|c)ss$/,
          // * Webpack goes from right to left
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  // * Enables modules for .module files.(scss|css...). Name - ts,js filename, local - style name
                  auto: /\.module\.\w+$/i,
                  localIdentName: '[name]__[local]'
                }
              }
            },
            // * Styles for different browsers
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    [
                      'postcss-preset-env',
                      {
                        // Options
                      }
                    ]
                  ]
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  // * @import 'abstracts/mixins'; works everywhere. Will search for such import from this folder
                  includePaths: [join(pathToRoot, 'styles')]
                }
              }
            }
          ]
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.(png|jpg|jpeg|webp)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name][ext]'
          }
        },
        {
          test: /\.(svg|gif|ico)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/icons/[name][ext]'
          }
        },
        {
          test: /\.(ttf|wof|wof2|eot)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[fullhash][ext]'
          }
        }
      ]
    }
  };
};

function optimization(isDev) {
  const config = {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single' //* Selects duplicate code in different js files into a separate file (for example, jquery for different pages)
  };
  if (!isDev) {
    config.minimizer = [
      new CssMinimizerPlugin(),
      new TerserWebpackPlugin() // minify/minimize JavaScript
    ];
  }
  return config;
}

function filename(dir, ext, isDev) {
  return isDev ? `${dir}/[name].${ext}` : `${dir}/[name].[fullhash].${ext}`;
}

function chooseDevOrProd(developmentValue, productionValue, isDev) {
  return isDev ? developmentValue : productionValue;
}
