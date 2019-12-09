const path = require("path");

// server webpack
module.exports = {
  mode: "development",
  entry: "./client/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public")
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: "babel-loader", // 支持import，jsx
      exclude: /node_modules/,
      options: {
        presets: ["@babel/preset-react", "@babel/preset-env"]
      }
    }]
  }
};