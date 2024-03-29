const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// Webpack entry points. Mapping from resulting bundle name to the source file entry.
const entries = {};

// Loop through subfolders in the "Samples" folder and add an entry for each one
const samplesDir = path.join(__dirname, "src/versions");
fs.readdirSync(samplesDir).filter((dir) => {
  if (dir !== "Common" && fs.statSync(path.join(samplesDir, dir)).isDirectory()) {
    entries[dir] = "./" + path.relative(process.cwd(), path.join(samplesDir, dir, dir));
  }
});

console.log("entries that are added", entries);

module.exports = {
  devtool: "inline-source-map",
  devServer: {
    https: true,
    port: 3000,
  },
  entry: entries,
  output: {
    publicPath: "/dist/",
    filename: "[name]/[name].js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk"),
    },
  },
  stats: {
    warnings: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "azure-devops-ui/buildScripts/css-variables-loader", "sass-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.woff$/,
        use: [
          {
            loader: "base64-inline-loader",
          },
        ],
      },
      {
        test: /\.html$/,
        loader: "file-loader",
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "**/*.html", context: "src/versions" }],
    }),
  ],
};
