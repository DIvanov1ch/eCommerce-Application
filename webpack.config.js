const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const EslintWebpackPlugin = require('eslint-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';

const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

const pwaManifestPlugin = new WebpackPwaManifest({
  publicPath: '.',
  name: 'Slick Deals Merch',
  short_name: 'SlickMerch',
  description: 'Slick merch from SlickDeals',
  background_color: '#333333',
  theme_color: '#333333',
  fingerprints: false,
  icons: [
    {
      src: path.resolve('src/assets/icons/maskable.png'),
      sizes: [512],
    },
    {
      src: path.resolve('src/assets/icons/maskable.png'),
      size: '1024x1024',
    },
    {
      src: path.resolve('src/assets/icons/maskable.png'),
      size: '1024x1024',
      purpose: 'maskable',
    },
  ],
});

const workboxPlugin = new WorkboxPlugin.GenerateSW({
  clientsClaim: true,
  skipWaiting: true,
});

const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    host: '0.0.0.0',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new CleanWebpackPlugin(),
    new EslintWebpackPlugin({ extensions: 'ts' }),
    pwaManifestPlugin,
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.html$/i,
        use: ['html-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
    config.plugins.push(workboxPlugin, new MiniCssExtractPlugin());
  } else {
    Object.assign(config, {
      mode: 'development',
      devtool: 'inline-source-map',
    });
  }
  return config;
};
