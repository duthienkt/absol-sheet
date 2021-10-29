const path = require('path');
const webpack = require('webpack');
const os = require('os');
const fs = require('fs');

var package = Object.assign({}, require("./package.json"));
package.buildPCName = os.hostname();
package.buildFolder = __dirname;
package.buildTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

delete package.scripts;
delete package.devDependencies;
delete package.main;


var https;
try {
    https = {
        key: fs.readFileSync('D:/Certs/absol.ddns.net/privkey.pem'),
        cert: fs.readFileSync('D:/Certs/absol.ddns.net/cert.pem'),
        cacert: fs.readFileSync('D:/Certs/absol.ddns.net/fullchain.pem'),
    }
}
catch (e){
    https = undefined;
}

module.exports = {
    mode: (process.env.MODE && false) || "development",
    entry: ['./dependents',"./dev.js"],
    output: {
        path: path.join(__dirname, "."),
        filename: "./absol/absol_sheet.js",
    },
    resolve: {
        modules: [
            path.join(__dirname, './node_modules')
        ],
        fallback: {
            fs: false,
            path: require.resolve("path-browserify"),
            buffer: require.resolve("buffer/"),
            "util": false,
            semver:false,
            "assert": require.resolve("assert/")
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: { presets: [['@babel/preset-env', { modules: false }]] }
            },
            {
                test: /\.(tpl|txt|xml|rels|svg)$/i,
                use: 'raw-loader',
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },
    optimization: {
        // We do not want to minimize our code.
        minimize: false
    },
    devServer: {
        compress: false,
        host: '0.0.0.0',
        static: __dirname,
        allowedHosts:["localhost", "absol.ddns.net"],
        https: https
    },
    performance: {
        hints: false
    },
    plugins: [
        new webpack.DefinePlugin({
            PACKAGE: JSON.stringify(package)
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ]
};