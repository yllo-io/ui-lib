const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const WorkboxPlugin = require('workbox-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
//var WebpackFtpUpload = require("webpack-ftp-upload-plugin");
const path = require('path')

const mode = process.env.NODE_ENV || 'development'
const prod = mode === 'production'

module.exports = (env, argv) => {
    const electron = env && env.electron ? true : false
    return {
        entry: {
            bundle: ['./src/main.js'],
        },
        resolve: {
            alias: {
                svelte: path.resolve('node_modules', 'svelte'),
            },
            extensions: ['.mjs', '.js', '.ts', '.svelte'],
            mainFields: ['svelte', 'browser', 'module', 'main'],
        },
        output: {
            path: __dirname + '/public',
            filename: electron ? '[name].js' : 'bundles/[name].[contenthash].js',
            publicPath: electron ? '' : mode == 'development' ? '/' : './',
            chunkFilename: 'wlt/[id].[contenthash].js',
        },
        module: {
            rules: [
                { test: /\.ts$/, exclude: /node_modules/, loader: 'ts-loader' },
                {
                    test: /\.svelte$/,
                    use: {
                        loader: 'svelte-loader',
                        options: {
                            emitCss: true,
                            hotReload: false,
                            preprocess: require('svelte-preprocess')({
                                // postcss: true,
                                /* options */
                            }),
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: [
                        /**
                         * MiniCssExtractPlugin doesn't support HMR.
                         * For developing, use 'style-loader' instead.
                         * */
                        prod || electron ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                    ],
                },
            ],
        },
        mode,
        plugins: [
            new MiniCssExtractPlugin({
                filename: electron ? '[name].css' : 'bundles/[name].[contenthash].css',
            }),
            // new WorkboxPlugin.GenerateSW({
            //     clientsClaim: true,
            //     skipWaiting: true,
            // }),
            new HtmlWebpackPlugin({
                template: mode == 'development' ? 'index.html' : 'index.php',
                filename: mode == 'development' ? 'index.html' : 'index.php',
            }),
        ],
        devtool: prod ? false : 'source-map',
    }
}
